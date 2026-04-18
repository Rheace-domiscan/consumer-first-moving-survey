import { SectionCard } from "@/components/ui/section-card";

type AuditEventListProps = {
  events: {
    id: string;
    createdAt: string | Date;
    actorType: string;
    actorId: string | null;
    eventType: string;
  }[];
};

export function AuditEventList({ events }: AuditEventListProps) {
  return (
    <SectionCard>
      <h3 className="text-lg font-semibold text-white">Recent activity</h3>
      <div className="mt-4 grid gap-3">
        {events.length ? (
          events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">{event.eventType.replaceAll("_", " ")}</p>
              <p className="mt-1 text-xs text-slate-400">
                {event.actorType}
                {event.actorId ? ` • ${event.actorId}` : ""}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
            No activity recorded yet.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
