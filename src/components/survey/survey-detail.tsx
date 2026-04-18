import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { getSurveyProgress } from "@/lib/survey-progress";
import { StatusBadge } from "@/components/survey/status-badge";
import { SectionCard } from "@/components/ui/section-card";
import { RoomActions } from "@/components/survey/room-actions";

export type SurveyDetailData = {
  id: string;
  title: string | null;
  status: string;
  propertyType: string | null;
  originPostcode: string | null;
  destinationPostcode: string | null;
  moveWindow: string | null;
  notes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  rooms: {
    id: string;
    name: string;
    status: string | null;
    mediaCount: number;
    notes: string | null;
  }[];
};

export function SurveyDetail({ survey }: { survey: SurveyDetailData }) {
  const progress = getSurveyProgress(survey.rooms);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <SectionCard>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-white">
            {survey.title || "Untitled draft survey"}
          </h1>
          <StatusBadge status={survey.status} />
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          This draft is the working container for later uploads, major-item
          extraction, completeness checks, and mover unlock flows.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Meta label="Total rooms" value={String(progress.totalRooms)} />
          <Meta label="Rooms with media" value={String(progress.roomsWithMedia)} />
          <Meta label="Completed rooms" value={String(progress.completedRooms)} />
          <Meta label="Progress" value={`${progress.percentComplete}%`} />
        </div>

        <div className="mt-4 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-3 rounded-full bg-violet-500 transition-all"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>

        <dl className="mt-8 grid gap-4 md:grid-cols-2">
          <Meta label="Property type" value={survey.propertyType || "Pending"} />
          <Meta label="Move window" value={survey.moveWindow || "Pending"} />
          <Meta label="Origin" value={survey.originPostcode || "Pending"} />
          <Meta label="Destination" value={survey.destinationPostcode || "Pending"} />
          <Meta label="Created" value={formatDateTime(survey.createdAt)} />
          <Meta label="Last updated" value={formatDateTime(survey.updatedAt)} />
        </dl>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Survey notes</h2>
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
            {survey.notes || "No notes yet."}
          </p>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Rooms and areas</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Use room-level completion to track capture progress. Uploads and review now
              roll up into a visible survey completion state.
            </p>
          </div>
          <Link
            href={`/survey/${survey.id}/upload`}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
          >
            Manage uploads
          </Link>
        </div>
        <div className="mt-6 grid gap-3">
          {survey.rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{room.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {room.mediaCount} media items linked so far
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {room.status || "Awaiting capture"}
                  </span>
                  <RoomActions surveyId={survey.id} roomId={room.id} currentStatus={room.status} />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-300">{room.notes || "No room notes yet."}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <dt className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-slate-100">{value}</dd>
    </div>
  );
}
