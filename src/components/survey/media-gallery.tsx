"use client";

import { useState } from "react";

type MediaItem = {
  id: string;
  fileName: string;
  kind: string;
  createdAt: string | Date;
  storageUrl: string | null;
};

export function MediaGallery({
  surveyId,
  roomId,
  items,
}: {
  surveyId: string;
  roomId: string;
  items: MediaItem[];
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteItem(mediaId: string) {
    setDeletingId(mediaId);
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}/rooms/${roomId}/media/${mediaId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to delete media.");
      setDeletingId(null);
      return;
    }

    window.location.reload();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-3 text-sm text-slate-400">
        No media attached for this room yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">{item.fileName}</p>
              <p className="mt-1 text-xs text-slate-400">{item.kind}</p>
            </div>
            <button
              type="button"
              onClick={() => deleteItem(item.id)}
              disabled={deletingId === item.id}
              className="rounded-full border border-rose-400/30 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingId === item.id ? "Deleting..." : "Delete"}
            </button>
          </div>
          {item.storageUrl ? (
            <a
              href={item.storageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-xs text-violet-200 transition hover:text-white"
            >
              Open file
            </a>
          ) : null}
        </div>
      ))}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
