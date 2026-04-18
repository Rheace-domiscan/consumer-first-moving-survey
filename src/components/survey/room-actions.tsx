"use client";

import { useState } from "react";

export function RoomActions({
  surveyId,
  roomId,
  currentStatus,
}: {
  surveyId: string;
  roomId: string;
  currentStatus: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus = currentStatus === "COMPLETE" ? "MEDIA_ATTACHED" : "COMPLETE";
  const label = currentStatus === "COMPLETE" ? "Mark incomplete" : "Mark room complete";

  async function updateStatus() {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}/rooms/${roomId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to update room status.");
      setPending(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={updateStatus}
        disabled={pending}
        className="rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving..." : label}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
