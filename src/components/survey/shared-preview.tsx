import { SectionCard } from "@/components/ui/section-card";

type SharedPreviewProps = {
  survey: {
    title: string | null;
    propertyType: string | null;
    originPostcode: string | null;
    destinationPostcode: string | null;
    moveWindow: string | null;
    notes: string | null;
    rooms: {
      id: string;
      name: string;
      status: string | null;
      mediaCount: number;
      notes: string | null;
    }[];
  };
};

export function SharedPreview({ survey }: SharedPreviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <SectionCard>
        <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Mover preview</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          {survey.title || "Untitled shared survey"}
        </h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SummaryItem label="Property type" value={survey.propertyType || "Pending"} />
          <SummaryItem label="Move window" value={survey.moveWindow || "Pending"} />
          <SummaryItem label="Origin" value={survey.originPostcode || "Pending"} />
          <SummaryItem label="Destination" value={survey.destinationPostcode || "Pending"} />
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold text-white">Move notes</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {survey.notes || "No overall survey notes provided yet."}
          </p>
        </div>
      </SectionCard>

      <SectionCard>
        <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Structured room preview</p>
        <div className="mt-6 grid gap-3">
          {survey.rooms.map((room) => (
            <div key={room.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{room.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{room.mediaCount} media items</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {room.status || "Awaiting capture"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{room.notes || "No room notes yet."}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}
