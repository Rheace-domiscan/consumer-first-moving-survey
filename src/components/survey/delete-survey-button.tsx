"use client";

import { useState } from "react";

export function DeleteSurveyButton({ surveyId }: { surveyId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeSurvey() {
    const confirmed = window.confirm(
      "Delete this survey permanently? This also removes uploads, extraction jobs, and unlock records.",
    );

    if (!confirmed) {
      return;
    }

    setPending(true);
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to delete survey.");
      setPending(false);
      return;
    }

    window.location.href = "/survey/list";
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={removeSurvey}
        disabled={pending}
        className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete survey"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
