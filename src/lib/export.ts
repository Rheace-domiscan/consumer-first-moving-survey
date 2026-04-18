import { buildQuoteReadySummary } from "@/lib/survey-output";

export function buildExportDocument(survey: Parameters<typeof buildQuoteReadySummary>[0]) {
  const summary = buildQuoteReadySummary(survey);

  return {
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    summary,
  };
}
