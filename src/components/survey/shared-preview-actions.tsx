"use client";

import { useEffect, useState } from "react";

export function SharedPreviewActions({
  token,
  moverEmailHint,
}: {
  token: string;
  moverEmailHint?: string | null;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/shared/${token}/view`, { method: "POST" }).catch(() => undefined);
  }, [token]);

  async function unlock() {
    setUnlocking(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/shared/${token}/unlock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ moverEmail: moverEmailHint || undefined }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to unlock preview.");
      setUnlocking(false);
      return;
    }

    setMessage("Mover unlock recorded.");
    setUnlocking(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Mover access</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        This preview records view and unlock actions so the owner-side workflow can track mover engagement.
      </p>
      <button
        type="button"
        onClick={unlock}
        disabled={unlocking}
        className="mt-4 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {unlocking ? "Unlocking..." : "Confirm unlock"}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
