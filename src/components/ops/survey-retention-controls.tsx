"use client";

import { useState } from "react";

export function SurveyRetentionControls({
  surveyId,
  state,
  initialArchiveAfterDays,
  initialPurgeAfterDays,
  initialExemptReason,
  canPurge,
}: {
  surveyId: string;
  state: "ACTIVE" | "ARCHIVED" | "EXEMPT";
  initialArchiveAfterDays: number | null;
  initialPurgeAfterDays: number | null;
  initialExemptReason: string | null;
  canPurge: boolean;
}) {
  const [archiveAfterDays, setArchiveAfterDays] = useState(
    initialArchiveAfterDays === null ? "" : String(initialArchiveAfterDays),
  );
  const [purgeAfterDays, setPurgeAfterDays] = useState(
    initialPurgeAfterDays === null ? "" : String(initialPurgeAfterDays),
  );
  const [exemptReason, setExemptReason] = useState(initialExemptReason ?? "");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveOverrides() {
    await runAction("set_overrides", {
      retentionArchiveAfterDays: archiveAfterDays ? Number(archiveAfterDays) : null,
      retentionPurgeAfterDays: purgeAfterDays ? Number(purgeAfterDays) : null,
    });
  }

  async function runAction(action: string, payload: Record<string, unknown> = {}) {
    if (action === "purge_now") {
      const confirmed = window.confirm(
        "Purge this survey and its stored data permanently?",
      );

      if (!confirmed) {
        return;
      }
    }

    setPendingAction(action);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/surveys/${surveyId}/retention`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        ...payload,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Retention update failed.");
      setPendingAction(null);
      return;
    }

    setMessage(action === "purge_now" ? "Survey purged." : "Retention update saved.");
    setPendingAction(null);
    window.location.reload();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Retention controls</p>
          <p className="mt-2 text-sm text-slate-300">
            Current state: <span className="font-medium text-white">{state}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-300">
          <span>Archive after days override</span>
          <input
            value={archiveAfterDays}
            onChange={(event) => setArchiveAfterDays(event.target.value)}
            inputMode="numeric"
            placeholder="Use global default"
            className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          <span>Purge after days override</span>
          <input
            value={purgeAfterDays}
            onChange={(event) => setPurgeAfterDays(event.target.value)}
            inputMode="numeric"
            placeholder="Use global default"
            className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm text-slate-300">
        <span>Exemption reason</span>
        <textarea
          value={exemptReason}
          onChange={(event) => setExemptReason(event.target.value)}
          rows={3}
          placeholder="Document why this survey should be excluded from automated retention."
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveOverrides}
          disabled={pendingAction !== null}
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "set_overrides" ? "Saving..." : "Save overrides"}
        </button>
        {state === "EXEMPT" ? (
          <button
            type="button"
            onClick={() => runAction("clear_exempt")}
            disabled={pendingAction !== null}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "clear_exempt" ? "Clearing..." : "Clear exempt"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => runAction("mark_exempt", { reason: exemptReason })}
            disabled={pendingAction !== null || !exemptReason.trim() || state === "ARCHIVED"}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "mark_exempt" ? "Marking..." : "Mark exempt"}
          </button>
        )}
        {state === "ARCHIVED" ? (
          <button
            type="button"
            onClick={() => runAction("restore")}
            disabled={pendingAction !== null}
            className="rounded-full border border-emerald-400/30 px-4 py-2 text-xs font-medium text-emerald-100 transition hover:border-emerald-300/50 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "restore" ? "Restoring..." : "Restore"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => runAction("archive_now")}
            disabled={pendingAction !== null}
            className="rounded-full border border-amber-400/30 px-4 py-2 text-xs font-medium text-amber-100 transition hover:border-amber-300/50 hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "archive_now" ? "Archiving..." : "Archive now"}
          </button>
        )}
        {canPurge ? (
          <button
            type="button"
            onClick={() => runAction("purge_now")}
            disabled={pendingAction !== null}
            className="rounded-full border border-rose-400/30 px-4 py-2 text-xs font-medium text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "purge_now" ? "Purging..." : "Purge survey"}
          </button>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
