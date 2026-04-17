import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/survey/status-badge";

export type SurveyListItem = {
  id: string;
  title: string | null;
  status: string;
  propertyType: string | null;
  originPostcode: string | null;
  destinationPostcode: string | null;
  updatedAt: string | Date;
  rooms: { id: string; name: string }[];
};

export function SurveyList({ surveys }: { surveys: SurveyListItem[] }) {
  if (surveys.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        No surveys yet. Create one to start building the consumer flow.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {surveys.map((survey) => (
        <Link
          key={survey.id}
          href={`/survey/${survey.id}`}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/[0.07]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-white">
                  {survey.title || "Untitled draft survey"}
                </h3>
                <StatusBadge status={survey.status} />
              </div>
              <p className="text-sm text-slate-300">
                {survey.propertyType || "Property type pending"}
                {survey.originPostcode ? ` • ${survey.originPostcode}` : ""}
                {survey.destinationPostcode ? ` → ${survey.destinationPostcode}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {survey.rooms.map((room) => (
                  <span
                    key={room.id}
                    className="inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100"
                  >
                    {room.name}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Updated {formatDateTime(survey.updatedAt)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
