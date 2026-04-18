"use client";

import { useState } from "react";

export function ExportCard({ surveyId }: { surveyId: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyJson() {
    setError(null);
    setCopied(false);

    const response = await fetch(`/api/surveys/${surveyId}/export`);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to fetch export JSON.");
      return;
    }

    const body = await response.json();
    await navigator.clipboard.writeText(JSON.stringify(body, null, 2));
    setCopied(true);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Export</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Copy a JSON export of the current survey summary. This is the first share/export surface
        for downstream mover workflows and future PDF generation.
      </p>
      <button
        type="button"
        onClick={copyJson}
        className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
      >
        Copy export JSON
      </button>
      {copied ? <p className="mt-3 text-sm text-emerald-300">Copied export JSON.</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
