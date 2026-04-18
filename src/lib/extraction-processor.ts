import { prisma } from "@/lib/prisma";

type ProcessorResult = {
  observedItems: { label: string; confidence: number; source: "observed" }[];
  declaredItems: { label: string; source: "declared" }[];
  needsReview: boolean;
};

export interface ExtractionProcessor {
  process(input: {
    roomName: string;
    roomNotes: string | null;
    mediaKind: string;
    fileName: string;
  }): Promise<ProcessorResult>;
}

export class PlaceholderExtractionProcessor implements ExtractionProcessor {
  async process(input: {
    roomName: string;
    roomNotes: string | null;
    mediaKind: string;
    fileName: string;
  }): Promise<ProcessorResult> {
    return {
      observedItems: [
        {
          label: `Observed placeholder from ${input.fileName} in ${input.roomName}`,
          confidence: input.mediaKind === "VIDEO" ? 0.42 : 0.38,
          source: "observed",
        },
      ],
      declaredItems: input.roomNotes
        ? [{ label: `Declared note: ${input.roomNotes}`, source: "declared" }]
        : [],
      needsReview: true,
    };
  }
}

export async function runExtractionProcessorForSurvey(
  surveyId: string,
  processor: ExtractionProcessor = new PlaceholderExtractionProcessor(),
) {
  const jobs = await prisma.extractionJob.findMany({
    where: {
      surveyId,
    },
    include: {
      media: {
        include: {
          surveyRoom: true,
        },
      },
    },
  });

  for (const job of jobs) {
    await prisma.extractionJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
      },
    });

    const result = await processor.process({
      roomName: job.media.surveyRoom.name,
      roomNotes: job.media.surveyRoom.notes,
      mediaKind: job.media.kind,
      fileName: job.media.fileName,
    });

    await prisma.extractionResult.upsert({
      where: {
        extractionJobId: job.id,
      },
      update: {
        surveyRoomId: job.media.surveyRoom.id,
        needsReview: result.needsReview,
        observedJson: JSON.stringify(result.observedItems),
        declaredJson: JSON.stringify(result.declaredItems),
      },
      create: {
        extractionJobId: job.id,
        surveyRoomId: job.media.surveyRoom.id,
        needsReview: result.needsReview,
        observedJson: JSON.stringify(result.observedItems),
        declaredJson: JSON.stringify(result.declaredItems),
      },
    });

    await prisma.extractionJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETE",
      },
    });
  }

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
