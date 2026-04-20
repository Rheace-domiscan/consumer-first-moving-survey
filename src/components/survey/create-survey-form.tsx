"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { roomOptions, propertyTypes } from "@/lib/survey";

type SubmitState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; surveyId: string }
  | { status: "error"; message: string };

export function CreateSurveyForm() {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState<(typeof propertyTypes)[number]>(propertyTypes[0]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([
    "Living room",
    "Kitchen",
    "Primary bedroom",
  ]);
  const [customRoom, setCustomRoom] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const canSubmit = useMemo(() => selectedRooms.length > 0, [selectedRooms.length]);

  function toggleRoom(room: string) {
    setSelectedRooms((current) =>
      current.includes(room)
        ? current.filter((entry) => entry !== room)
        : [...current, room],
    );
  }

  function addCustomRoom() {
    const value = customRoom.trim();
    if (!value || selectedRooms.includes(value)) return;
    setSelectedRooms((current) => [...current, value]);
    setCustomRoom("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitState({ status: "saving" });

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") || ""),
      originPostcode: String(formData.get("originPostcode") || ""),
      destinationPostcode: String(formData.get("destinationPostcode") || ""),
      propertyType: String(formData.get("propertyType") || propertyType),
      moveWindow: String(formData.get("moveWindow") || ""),
      notes: String(formData.get("notes") || ""),
      rooms: selectedRooms,
    };

    const response = await fetch("/api/surveys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setSubmitState({
        status: "error",
        message: body?.error ?? "Failed to create survey.",
      });
      return;
    }

    const body = (await response.json()) as { id: string };
    setSubmitState({ status: "success", surveyId: body.id });
    router.push(`/survey/${body.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-200">
          <span>Survey title</span>
          <input
            name="title"
            defaultValue=""
            placeholder="3-bed move, London to Bristol"
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-200">
          <span>Property type</span>
          <select
            name="propertyType"
            value={propertyType}
            onChange={(event) =>
              setPropertyType(event.target.value as (typeof propertyTypes)[number])
            }
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
          >
            {propertyTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-200">
          <span>Origin postcode</span>
          <input
            name="originPostcode"
            defaultValue=""
            placeholder="SW1A 1AA"
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-200">
          <span>Destination postcode</span>
          <input
            name="destinationPostcode"
            defaultValue=""
            placeholder="BS1 4DJ"
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
          <span>Move window</span>
          <input
            name="moveWindow"
            defaultValue=""
            placeholder="Late May, flexible over 3 days"
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Areas to survey</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Start with the main spaces. You can add custom rooms for lofts, storage,
            outdoor spaces, or anything unusual.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {roomOptions.map((room) => {
            const active = selectedRooms.includes(room);
            return (
              <button
                key={room}
                type="button"
                onClick={() => toggleRoom(room)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  active
                    ? "border-violet-400/60 bg-violet-500/15 text-violet-50"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
                }`}
              >
                {room}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={customRoom}
            onChange={(event) => setCustomRoom(event.target.value)}
            placeholder="Add custom area, e.g. Garden office"
            className="flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={addCustomRoom}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/5"
          >
            Add area
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedRooms.map((room) => (
            <span
              key={room}
              className="inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100"
            >
              {room}
            </span>
          ))}
        </div>
      </div>

      <label className="block space-y-2 text-sm text-slate-200">
        <span>Survey notes</span>
        <textarea
          name="notes"
          defaultValue=""
          rows={4}
          placeholder="Parking constraints, access problems, fragile items, storage overlap, anything useful for quoting."
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500"
        />
      </label>

      <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
        <button
          type="submit"
          disabled={!canSubmit || submitState.status === "saving"}
          className="w-full rounded-full bg-violet-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitState.status === "saving" ? "Creating survey..." : "Create survey draft"}
        </button>

        {submitState.status === "success" ? (
          <p className="text-sm text-emerald-300">
            Survey created. Draft id: <span className="font-mono">{submitState.surveyId}</span>
          </p>
        ) : null}

        {submitState.status === "error" ? (
          <p className="text-sm text-rose-300">{submitState.message}</p>
        ) : null}
      </div>
    </form>
  );
}
