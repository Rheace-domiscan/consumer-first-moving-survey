export type ExtractionQueueItem = {
  surveyId: string;
  roomId: string;
  mediaId: string;
  kind: string;
  fileName: string;
};

export type ExtractionResultDraft = {
  roomId: string;
  observedItems: {
    label: string;
    confidence: number;
    source: "observed";
  }[];
  declaredItems: {
    label: string;
    source: "declared";
  }[];
  needsReview: boolean;
};

export function buildExtractionQueue(items: ExtractionQueueItem[]) {
  return items.map((item) => ({
    surveyId: item.surveyId,
    roomId: item.roomId,
    mediaId: item.mediaId,
    fileName: item.fileName,
    extractionMode: item.kind === "VIDEO" ? "major-items-from-video" : "major-items-from-image",
    status: "PENDING",
  }));
}

export function buildPlaceholderExtractionResult(input: {
  roomId: string;
  roomName: string;
  roomNotes: string | null;
  mediaCount: number;
}): ExtractionResultDraft {
  const declaredItems = input.roomNotes
    ? [{ label: `Declared note: ${input.roomNotes}`, source: "declared" as const }]
    : [];

  return {
    roomId: input.roomId,
    observedItems:
      input.mediaCount > 0
        ? [{ label: `Observed major items placeholder for ${input.roomName}`, confidence: 0.35, source: "observed" as const }]
        : [],
    declaredItems,
    needsReview: true,
  };
}
