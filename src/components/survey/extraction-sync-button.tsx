"use client";

import { useState } from "react";

export function ExtractionSyncButton({ surveyId }: { surveyId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sync() {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}/extraction/sync`, {
      method: "POST",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to sync extraction artifacts.");
      setPending(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={sync}
        disabled={pending}
        className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Syncing..." : "Sync extraction artifacts"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
