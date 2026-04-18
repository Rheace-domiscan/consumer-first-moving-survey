"use client";

import { useMemo, useState } from "react";
import { UploadRoomCard } from "@/components/survey/upload-room-card";

type Room = {
  id: string;
  name: string;
  mediaCount: number;
  status: string | null;
  notes: string | null;
  media?: {
    id: string;
    fileName: string;
    kind: string;
    createdAt: string | Date;
    storageUrl: string | null;
  }[];
};

export function UploadPanel({
  surveyId,
  rooms,
}: {
  surveyId: string;
  rooms: Room[];
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0],
    [rooms, selectedRoomId],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file || !selectedRoomId) {
      setError("Choose a room and a file first.");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("roomId", selectedRoomId);
    formData.append("file", file);

    const response = await fetch(`/api/surveys/${surveyId}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Upload failed.");
      setSubmitting(false);
      return;
    }

    setMessage(`Uploaded ${file.name}. Refreshing room state...`);
    form.reset();
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-white">Select area</h2>
          <div className="mt-4 grid gap-3">
            {rooms.map((room) => {
              const active = room.id === selectedRoomId;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-violet-400/60 bg-violet-500/15 text-violet-50"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{room.name}</span>
                    <span className="text-xs text-slate-300">{room.mediaCount} files</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-white">Upload room media</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            This is the first upload handoff for {selectedRoom?.name || "the selected room"}.
            Right now it stores file metadata and uses the object storage abstraction,
            ready for Cloudflare R2 credentials.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <input
              name="file"
              type="file"
              accept="image/*,video/*"
              className="block w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-violet-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            <button
              type="submit"
              disabled={submitting || !selectedRoomId}
              className="rounded-full bg-violet-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Uploading..." : "Upload media"}
            </button>
          </form>

          {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </div>
      </div>

      <div className="grid gap-4">
        {rooms.map((room) => (
          <UploadRoomCard key={room.id} surveyId={surveyId} room={room} />
        ))}
      </div>
    </div>
  );
}
