"use client";

import { useState } from "react";

export function MoverUnlockActions({
  surveyId,
  unlockId,
  currentStatus,
}: {
  surveyId: string;
  unlockId: string;
  currentStatus: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(status: string) {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}/mover-unlocks/${unlockId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to update mover unlock.");
      setPending(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {currentStatus !== "UNLOCKED" ? (
          <button
            type="button"
            onClick={() => update("UNLOCKED")}
            disabled={pending}
            className="rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark unlocked
          </button>
        ) : null}
        {currentStatus !== "DECLINED" ? (
          <button
            type="button"
            onClick={() => update("DECLINED")}
            disabled={pending}
            className="rounded-full border border-rose-400/30 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark declined
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
