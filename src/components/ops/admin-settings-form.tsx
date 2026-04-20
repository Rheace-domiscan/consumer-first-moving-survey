"use client";

import { useState } from "react";

type PolicyShape = {
  activeSurveyArchiveDays: number;
  archivedSurveyPurgeDays: number;
  mediaRetentionDays: number;
  auditRetentionDays: number;
  purgeEnabled: boolean;
  allowOwnerDelete: boolean;
};

export function AdminSettingsForm({
  policy,
}: {
  policy: PolicyShape;
}) {
  const [form, setForm] = useState({
    activeSurveyArchiveDays: String(policy.activeSurveyArchiveDays),
    archivedSurveyPurgeDays: String(policy.archivedSurveyPurgeDays),
    mediaRetentionDays: String(policy.mediaRetentionDays),
    auditRetentionDays: String(policy.auditRetentionDays),
    purgeEnabled: policy.purgeEnabled,
    allowOwnerDelete: policy.allowOwnerDelete,
  });
  const [pending, setPending] = useState<"save" | "run" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveSettings() {
    setPending("save");
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activeSurveyArchiveDays: Number(form.activeSurveyArchiveDays),
        archivedSurveyPurgeDays: Number(form.archivedSurveyPurgeDays),
        mediaRetentionDays: Number(form.mediaRetentionDays),
        auditRetentionDays: Number(form.auditRetentionDays),
        purgeEnabled: form.purgeEnabled,
        allowOwnerDelete: form.allowOwnerDelete,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to save admin settings.");
      setPending(null);
      return;
    }

    setMessage("Retention policy updated.");
    setPending(null);
    window.location.reload();
  }

  async function runRetentionSweepNow() {
    setPending("run");
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/retention/run", {
      method: "POST",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to run retention sweep.");
      setPending(null);
      return;
    }

    const body = (await response.json().catch(() => null)) as
      | {
          archivedSurveyIds?: string[];
          purgedSurveyIds?: string[];
          mediaPurgedCount?: number;
          auditPurgedCount?: number;
        }
      | null;

    setMessage(
      `Retention sweep finished. Archived ${body?.archivedSurveyIds?.length ?? 0}, purged ${body?.purgedSurveyIds?.length ?? 0}, media pruned ${body?.mediaPurgedCount ?? 0}, audit rows pruned ${body?.auditPurgedCount ?? 0}.`,
    );
    setPending(null);
    window.location.reload();
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SettingField
          label="Archive active surveys after days"
          value={form.activeSurveyArchiveDays}
          onChange={(value) => setForm((current) => ({ ...current, activeSurveyArchiveDays: value }))}
        />
        <SettingField
          label="Purge archived surveys after days"
          value={form.archivedSurveyPurgeDays}
          onChange={(value) => setForm((current) => ({ ...current, archivedSurveyPurgeDays: value }))}
        />
        <SettingField
          label="Purge archived media after days"
          value={form.mediaRetentionDays}
          onChange={(value) => setForm((current) => ({ ...current, mediaRetentionDays: value }))}
        />
        <SettingField
          label="Delete audit events after days"
          value={form.auditRetentionDays}
          onChange={(value) => setForm((current) => ({ ...current, auditRetentionDays: value }))}
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={form.purgeEnabled}
          onChange={(event) => setForm((current) => ({ ...current, purgeEnabled: event.target.checked }))}
        />
        Enable destructive retention sweep actions
      </label>
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={form.allowOwnerDelete}
          onChange={(event) => setForm((current) => ({ ...current, allowOwnerDelete: event.target.checked }))}
        />
        Allow owners to permanently delete their own surveys
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveSettings}
          disabled={pending !== null}
          className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "save" ? "Saving..." : "Save policy"}
        </button>
        <button
          type="button"
          onClick={runRetentionSweepNow}
          disabled={pending !== null}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "run" ? "Running..." : "Run retention sweep now"}
        </button>
      </div>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

function SettingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
      />
    </label>
  );
}
