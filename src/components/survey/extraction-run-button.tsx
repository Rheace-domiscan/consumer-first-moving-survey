"use client";

import { useState } from "react";

type ExtractionRunButtonProps = {
  surveyId: string;
  disabledReason?: string | null;
  helperText?: string | null;
};

export function ExtractionRunButton({
  surveyId,
  disabledReason = null,
  helperText = null,
}: ExtractionRunButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDisabled = pending || Boolean(disabledReason);

  async function run() {
    if (isDisabled) {
      return;
    }

    setPending(true);
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}/extraction/run`, {
      method: "POST",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to run extraction processor.");
      setPending(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={run}
        disabled={isDisabled}
        className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Running..." : "Run extraction processor"}
      </button>
      {disabledReason ? <p className="text-xs text-amber-200">{disabledReason}</p> : null}
      {!disabledReason && helperText ? <p className="text-xs text-slate-400">{helperText}</p> : null}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
