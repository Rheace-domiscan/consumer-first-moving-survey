import { prisma } from "@/lib/prisma";

type ProcessorResult = {
  observedItems: { label: string; confidence: number; source: "observed" }[];
  declaredItems: { label: string; source: "declared" }[];
  needsReview: boolean;
  processorVersion?: string;
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
    const observedItems = buildHeuristicObservedItems(input);

    return {
      observedItems,
      declaredItems: input.roomNotes
        ? [{ label: `Declared note: ${input.roomNotes}`, source: "declared" }]
        : [],
      needsReview: true,
      processorVersion: "heuristic-v1",
    };
  }
}

function buildHeuristicObservedItems(input: {
  roomName: string;
  roomNotes: string | null;
  mediaKind: string;
  fileName: string;
}) {
  const hints = `${input.roomName} ${input.fileName} ${input.roomNotes || ""}`.toLowerCase();
  const items: { label: string; confidence: number; source: "observed" }[] = [];

  if (/(bed|bedroom)/.test(hints)) {
    items.push({ label: "Bed", confidence: 0.64, source: "observed" });
  }
  if (/(sofa|couch|living)/.test(hints)) {
    items.push({ label: "Sofa", confidence: 0.58, source: "observed" });
  }
  if (/(table|dining)/.test(hints)) {
    items.push({ label: "Table", confidence: 0.52, source: "observed" });
  }
  if (/(wardrobe|closet)/.test(hints)) {
    items.push({ label: "Wardrobe", confidence: 0.55, source: "observed" });
  }
  if (/(desk|office)/.test(hints)) {
    items.push({ label: "Desk", confidence: 0.57, source: "observed" });
  }
  if (/(fridge|kitchen)/.test(hints)) {
    items.push({ label: "Fridge / major kitchen appliance", confidence: 0.5, source: "observed" });
  }

  if (items.length === 0) {
    items.push({
      label: `Observed major items placeholder from ${input.fileName} in ${input.roomName}`,
      confidence: input.mediaKind === "VIDEO" ? 0.42 : 0.38,
      source: "observed",
    });
  }

  return items;
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
