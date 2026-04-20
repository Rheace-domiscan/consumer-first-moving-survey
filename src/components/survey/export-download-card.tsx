"use client";

import Link from "next/link";
import { useState } from "react";

export function ExportDownloadCard({ surveyId }: { surveyId: string }) {
  const [error, setError] = useState<string | null>(null);

  async function downloadJson() {
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

  async function downloadCsv() {
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}/export/csv`);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to download CSV export.");
      return;
    }

    const csv = await response.text();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `survey-${surveyId}-items.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Download export</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Download the survey package as JSON or CSV for mover handoff, debugging, or downstream processing.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadJson}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
        >
          Download CSV
        </button>
        <Link
          href={`/survey/${surveyId}/print`}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
        >
          Open print package
        </Link>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
