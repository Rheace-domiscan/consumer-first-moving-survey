export const PROCESSOR_VERSION = "major-items-apple-vision-v1";

export type ProcessorResult = {
  observedItems: {
    label: string;
    confidence: number;
    source: "observed";
    evidence?: string[];
  }[];
  declaredItems: {
    label: string;
    source: "declared";
    evidence?: string[];
  }[];
  needsReview: boolean;
  processorVersion: string;
  confidenceScore: number;
  qualityTier: "High" | "Medium" | "Low";
  reviewReasons: string[];
  summary: {
    analyzer: "APPLE_VISION" | "HEURISTIC_FALLBACK";
    roomName: string;
    mediaKind: string;
    pixelWidth: number | null;
    pixelHeight: number | null;
    durationSeconds: number | null;
    framesAnalyzed: number;
    topClassifications: {
      identifier: string;
      confidence: number;
    }[];
    detectedText: string[];
    usedFallback: boolean;
  };
};

export interface ExtractionProcessor {
  process(input: {
    roomName: string;
    roomNotes: string | null;
    mediaKind: string;
    fileName: string;
    storageKey: string;
    storageUrl: string | null;
  }): Promise<ProcessorResult>;
}
