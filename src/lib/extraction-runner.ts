import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { analyzeMediaWithVision } from "@/lib/vision-analyzer";
import {
  buildDeclaredItems,
  buildObservedItems,
  buildReviewReasons,
  deriveConfidenceScore,
  roundToThree,
  scoreToTier,
} from "@/lib/extraction-heuristics";
import {
  claimExtractionJobs,
  computeInputFingerprint,
  listExtractionJobsForSurvey,
  processExtractionJob,
  upsertPendingResult,
} from "@/lib/extraction-jobs";
import {
  PROCESSOR_VERSION,
  type ExtractionProcessor,
  type ProcessorResult,
} from "@/lib/extraction-types";

const DEFAULT_JOB_LIMIT = 10;

export class LocalMajorItemExtractionProcessor implements ExtractionProcessor {
  async process(input: {
    roomName: string;
    roomNotes: string | null;
    mediaKind: string;
    fileName: string;
    storageKey: string;
    storageUrl: string | null;
  }): Promise<ProcessorResult> {
    const vision = await analyzeMediaWithVision({
      mediaKind: input.mediaKind,
      storageKey: input.storageKey,
      storageUrl: input.storageUrl,
    });

    const declaredItems = buildDeclaredItems(input.roomNotes);
    const observedItems = buildObservedItems({
      roomName: input.roomName,
      roomNotes: input.roomNotes,
      fileName: input.fileName,
      mediaKind: input.mediaKind,
      vision,
      declaredItems,
    });

    const reviewReasons = buildReviewReasons({
      observedItems,
      declaredItems,
      vision,
    });
    const confidenceScore = deriveConfidenceScore({
      observedItems,
      declaredItems,
      vision,
      reviewReasons,
    });
    const qualityTier = scoreToTier(confidenceScore);

    return {
      observedItems,
      declaredItems,
      needsReview: reviewReasons.length > 0 || confidenceScore < 75,
      processorVersion: PROCESSOR_VERSION,
      confidenceScore,
      qualityTier,
      reviewReasons,
      summary: {
        analyzer: vision ? "APPLE_VISION" : "HEURISTIC_FALLBACK",
        roomName: input.roomName,
        mediaKind: input.mediaKind,
        pixelWidth: vision?.pixelWidth ?? null,
        pixelHeight: vision?.pixelHeight ?? null,
        durationSeconds: vision?.durationSeconds ?? null,
        framesAnalyzed: vision?.framesAnalyzed ?? 0,
        topClassifications: (vision?.classifications ?? []).slice(0, 6).map((entry) => ({
          identifier: entry.identifier,
          confidence: roundToThree(entry.confidence),
        })),
        detectedText: (vision?.texts ?? []).slice(0, 6).map((entry) => entry.text),
        usedFallback: !vision,
      },
    };
  }
}

export async function syncExtractionArtifactsForSurvey(surveyId: string) {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      rooms: {
        include: {
          media: true,
        },
      },
      extractionJobs: {
        include: {
          result: true,
          media: true,
        },
      },
    },
  });

  if (!survey) {
    throw new Error("Survey not found.");
  }

  for (const room of survey.rooms) {
    for (const media of room.media) {
      const inputFingerprint = computeInputFingerprint({
        roomName: room.name,
        roomNotes: room.notes,
        mediaId: media.id,
        fileName: media.fileName,
        mediaKind: media.kind,
        storageKey: media.storageKey,
        updatedAt: media.updatedAt,
      });

      const existingJob = survey.extractionJobs.find((job) => job.mediaId === media.id);

      if (!existingJob) {
        const job = await prisma.extractionJob.create({
          data: {
            surveyId,
            mediaId: media.id,
            mode: media.kind === "VIDEO" ? "major-items-from-video" : "major-items-from-image",
            status: "PENDING",
            inputFingerprint,
          },
        });

        await upsertPendingResult(job.id, room.id, room.notes);
        continue;
      }

      if (existingJob.inputFingerprint !== inputFingerprint || existingJob.status === "FAILED") {
        await prisma.extractionJob.update({
          where: { id: existingJob.id },
          data: {
            status: "PENDING",
            availableAt: new Date(),
            completedAt: null,
            failedAt: null,
            lastError: null,
            processorVersion: null,
            inputFingerprint,
            leaseToken: null,
            leaseExpiresAt: null,
          },
        });

        await upsertPendingResult(existingJob.id, room.id, room.notes);
      }
    }
  }

  return listExtractionJobsForSurvey(surveyId);
}

export async function runExtractionWorkerOnce(input?: {
  surveyId?: string;
  limit?: number;
  workerId?: string;
  processor?: ExtractionProcessor;
  trigger?: string;
}) {
  const workerId = input?.workerId || `worker-${crypto.randomUUID()}`;
  const processor = input?.processor || new LocalMajorItemExtractionProcessor();
  const claimedJobs = await claimExtractionJobs({
    surveyId: input?.surveyId,
    limit: input?.limit ?? DEFAULT_JOB_LIMIT,
    workerId,
  });

  const run = await prisma.backgroundJobRun.create({
    data: {
      jobType: "EXTRACTION_WORKER",
      scope: input?.surveyId ?? "global",
      status: "STARTED",
      metadataJson: JSON.stringify({
        workerId,
        trigger: input?.trigger ?? "manual",
        claimedJobIds: claimedJobs.map((job) => job.id),
      }),
    },
  });

  let processedCount = 0;
  let failedCount = 0;

  for (const job of claimedJobs) {
    const result = await processExtractionJob(job.id, processor);
    if (result.ok) {
      processedCount += 1;
    } else {
      failedCount += 1;
    }
  }

  await prisma.backgroundJobRun.update({
    where: { id: run.id },
    data: {
      status: failedCount > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
      processedCount,
      failedCount,
      completedAt: new Date(),
      notes:
        claimedJobs.length > 0
          ? `Processed ${processedCount} extraction jobs and failed ${failedCount}.`
          : "No extraction jobs were ready to claim.",
    },
  });

  return {
    runId: run.id,
    workerId,
    processedCount,
    failedCount,
    claimedJobs: claimedJobs.map((job) => job.id),
  };
}

export async function runExtractionProcessorForSurvey(
  surveyId: string,
  processor: ExtractionProcessor = new LocalMajorItemExtractionProcessor(),
) {
  await runExtractionWorkerOnce({
    surveyId,
    limit: 50,
    processor,
    trigger: "survey_run_route",
  });

  return listExtractionJobsForSurvey(surveyId);
}
