"use client";

import { useState } from "react";

export function ExportDownloadCard({ surveyId }: { surveyId: string }) {
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}/export`);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to download export.");
      return;
    }

    const body = await response.json();
    const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `survey-${surveyId}-export.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Download export</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Download the survey export as a JSON file for handoff, debugging, or downstream processing.
      </p>
      <button
        type="button"
        onClick={download}
        className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
      >
        Download JSON
      </button>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
