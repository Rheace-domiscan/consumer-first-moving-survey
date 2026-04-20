import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { env } from "@/lib/env";
import { buildDeclaredItems } from "@/lib/extraction-heuristics";
import type { ExtractionProcessor } from "@/lib/extraction-types";

const EXTRACTION_RETRY_LIMIT = env.extractionRetryLimit;
const EXTRACTION_LEASE_SECONDS = env.extractionWorkerLeaseSeconds;

export async function listExtractionJobsForSurvey(surveyId: string) {
  return prisma.extractionJob.findMany({
    where: {
      surveyId,
    },
    include: {
      media: true,
      result: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function upsertPendingResult(
  extractionJobId: string,
  surveyRoomId: string,
  roomNotes: string | null,
) {
  const declaredItems = buildDeclaredItems(roomNotes);

  await prisma.extractionResult.upsert({
    where: {
      extractionJobId,
    },
    update: {
      surveyRoomId,
      needsReview: true,
      confidenceScore: 0,
      qualityTier: "Low",
      majorItemCount: 0,
      observedJson: JSON.stringify([]),
      declaredJson: JSON.stringify(declaredItems),
      summaryJson: JSON.stringify({
        analyzer: "PENDING",
        usedFallback: true,
      }),
      reviewReasonsJson: JSON.stringify(["Awaiting extraction worker processing."]),
    },
    create: {
      extractionJobId,
      surveyRoomId,
      needsReview: true,
      confidenceScore: 0,
      qualityTier: "Low",
      majorItemCount: 0,
      observedJson: JSON.stringify([]),
      declaredJson: JSON.stringify(declaredItems),
      summaryJson: JSON.stringify({
        analyzer: "PENDING",
        usedFallback: true,
      }),
      reviewReasonsJson: JSON.stringify(["Awaiting extraction worker processing."]),
    },
  });
}

export async function claimExtractionJobs(input: {
  surveyId?: string;
  limit: number;
  workerId: string;
}) {
  const now = new Date();
  const staleLeaseThreshold = now;
  const candidates = await prisma.extractionJob.findMany({
    where: {
      ...(input.surveyId ? { surveyId: input.surveyId } : {}),
      availableAt: {
        lte: now,
      },
      OR: [
        {
          status: "PENDING",
        },
        {
          status: "PROCESSING",
          leaseExpiresAt: {
            lt: staleLeaseThreshold,
          },
        },
      ],
    },
    orderBy: [
      {
        priority: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
    take: input.limit,
  });

  const claimed: typeof candidates = [];

  for (const candidate of candidates) {
    const leaseToken = `${input.workerId}:${candidate.id}:${Date.now()}`;
    const claimedAt = new Date();
    const updated = await prisma.extractionJob.updateMany({
      where: {
        id: candidate.id,
        OR: [
          {
            status: "PENDING",
          },
          {
            status: "PROCESSING",
            leaseExpiresAt: {
              lt: staleLeaseThreshold,
            },
          },
        ],
      },
      data: {
        status: "PROCESSING",
        attempts: candidate.attempts + 1,
        startedAt: claimedAt,
        leaseToken,
        leaseExpiresAt: addSeconds(claimedAt, EXTRACTION_LEASE_SECONDS),
        lastError: null,
      },
    });

    if (updated.count === 0) {
      continue;
    }

    claimed.push(candidate);
  }

  return claimed;
}

export async function processExtractionJob(jobId: string, processor: ExtractionProcessor) {
  const job = await prisma.extractionJob.findUnique({
    where: { id: jobId },
    include: {
      survey: true,
      media: {
        include: {
          surveyRoom: true,
        },
      },
      result: true,
    },
  });

  if (!job) {
    return { ok: false as const };
  }

  try {
    const result = await processor.process({
      roomName: job.media.surveyRoom.name,
      roomNotes: job.media.surveyRoom.notes,
      mediaKind: job.media.kind,
      fileName: job.media.fileName,
      storageKey: job.media.storageKey,
      storageUrl: job.media.storageUrl,
    });

    await prisma.extractionResult.upsert({
      where: {
        extractionJobId: job.id,
      },
      update: {
        surveyRoomId: job.media.surveyRoom.id,
        needsReview: result.needsReview,
        confidenceScore: result.confidenceScore,
        qualityTier: result.qualityTier,
        majorItemCount: result.observedItems.length,
        observedJson: JSON.stringify(result.observedItems),
        declaredJson: JSON.stringify(result.declaredItems),
        summaryJson: JSON.stringify(result.summary),
        reviewReasonsJson: JSON.stringify(result.reviewReasons),
      },
      create: {
        extractionJobId: job.id,
        surveyRoomId: job.media.surveyRoom.id,
        needsReview: result.needsReview,
        confidenceScore: result.confidenceScore,
        qualityTier: result.qualityTier,
        majorItemCount: result.observedItems.length,
        observedJson: JSON.stringify(result.observedItems),
        declaredJson: JSON.stringify(result.declaredItems),
        summaryJson: JSON.stringify(result.summary),
        reviewReasonsJson: JSON.stringify(result.reviewReasons),
      },
    });

    await prisma.extractionJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETE",
        completedAt: new Date(),
        failedAt: null,
        lastError: null,
        processorVersion: result.processorVersion,
        leaseToken: null,
        leaseExpiresAt: null,
      },
    });

    await recordAuditEvent({
      surveyId: job.surveyId,
      actorType: "system",
      actorId: "extraction_worker",
      eventType: "extraction_job_completed",
      payload: {
        extractionJobId: job.id,
        mediaId: job.mediaId,
        confidenceScore: result.confidenceScore,
        qualityTier: result.qualityTier,
        needsReview: result.needsReview,
      },
    });

    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction processor failed.";
    const shouldRetry = job.attempts < EXTRACTION_RETRY_LIMIT;

    await prisma.extractionJob.update({
      where: { id: job.id },
      data: {
        status: shouldRetry ? "PENDING" : "FAILED",
        availableAt: shouldRetry ? addSeconds(new Date(), job.attempts * 30 + 30) : new Date(),
        failedAt: new Date(),
        lastError: message,
        leaseToken: null,
        leaseExpiresAt: null,
      },
    });

    await prisma.extractionResult.upsert({
      where: {
        extractionJobId: job.id,
      },
      update: {
        surveyRoomId: job.media.surveyRoom.id,
        needsReview: true,
        reviewReasonsJson: JSON.stringify([message]),
      },
      create: {
        extractionJobId: job.id,
        surveyRoomId: job.media.surveyRoom.id,
        needsReview: true,
        confidenceScore: 0,
        qualityTier: "Low",
        majorItemCount: 0,
        observedJson: JSON.stringify([]),
        declaredJson: JSON.stringify(buildDeclaredItems(job.media.surveyRoom.notes)),
        reviewReasonsJson: JSON.stringify([message]),
      },
    });

    await recordAuditEvent({
      surveyId: job.surveyId,
      actorType: "system",
      actorId: "extraction_worker",
      eventType: "extraction_job_failed",
      payload: {
        extractionJobId: job.id,
        mediaId: job.mediaId,
        error: message,
        willRetry: shouldRetry,
      },
    });

    return { ok: false as const };
  }
}

export function computeInputFingerprint(input: {
  roomName: string;
  roomNotes: string | null;
  mediaId: string;
  fileName: string;
  mediaKind: string;
  storageKey: string;
  updatedAt: Date;
}) {
  return crypto
    .createHash("sha1")
    .update(
      [
        input.roomName,
        input.roomNotes ?? "",
        input.mediaId,
        input.fileName,
        input.mediaKind,
        input.storageKey,
        input.updatedAt.toISOString(),
      ].join("|"),
    )
    .digest("hex");
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}
