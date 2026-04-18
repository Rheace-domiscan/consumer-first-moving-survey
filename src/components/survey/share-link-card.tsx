"use client";

import { useState } from "react";

export function ShareLinkCard({
  surveyId,
  existingToken,
}: {
  surveyId: string;
  existingToken: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [token, setToken] = useState(existingToken);
  const [error, setError] = useState<string | null>(null);

  async function createLink() {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}/share`, {
      method: "POST",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to create share link.");
      setPending(false);
      return;
    }

    const body = (await response.json()) as { shareToken: string };
    setToken(body.shareToken);
    setPending(false);
  }

  const url = token ? `${window.location.origin}/shared/${token}` : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Mover share link</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Create a share link for a mover-facing preview. This is the first gated unlock shape,
        not the full commercial flow yet.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={createLink}
          disabled={pending}
          className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : token ? "Regenerate link" : "Create share link"}
        </button>
      </div>
      {url ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
          {url}
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
