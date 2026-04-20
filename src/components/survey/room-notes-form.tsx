"use client";

import { useState } from "react";

export function RoomNotesForm({
  surveyId,
  roomId,
  initialNotes,
}: {
  surveyId: string;
  roomId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveNotes(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextNotes = String(formData.get("notes") ?? "");

    setSaving(true);
    setMessage(null);
    setError(null);
    setNotes(nextNotes);

    const response = await fetch(`/api/surveys/${surveyId}/rooms/${roomId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes: nextNotes }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to save room notes.");
      setSaving(false);
      return;
    }

    setMessage("Saved room notes.");
    setSaving(false);
  }

  return (
    <form className="space-y-3" onSubmit={saveNotes}>
      <textarea
        name="notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        placeholder="Add packing instructions, access notes, fragile items, or missing details for this room."
        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
      />
      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save notes"}
        </button>
        {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
        {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      </div>
    </form>
  );
}
