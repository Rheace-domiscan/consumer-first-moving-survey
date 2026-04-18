import { SectionCard } from "@/components/ui/section-card";

type QuoteSummaryProps = {
  summary: {
    surveyTitle: string;
    moveContext: {
      propertyType: string;
      originPostcode: string;
      destinationPostcode: string;
      moveWindow: string;
    };
    completeness: {
      totalRooms: number;
      completedRooms: number;
      roomsWithMedia: number;
      readyForMoverPreview: boolean;
    };
    roomSummaries: {
      id: string;
      name: string;
      status: string;
      mediaCount: number;
      notes: string | null;
    }[];
    moverPreview: {
      structuredInventoryStatus: string;
      notesForMover: string | null;
    };
  };
};

export function QuoteSummary({ summary }: QuoteSummaryProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <SectionCard>
        <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Consumer summary</p>
        <h2 className="mt-4 text-2xl font-semibold text-white">Quote-ready survey summary</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          This is the first structured output layer for the consumer. It is the bridge
          between self-survey progress and the later mover-facing unlock experience.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SummaryItem label="Property type" value={summary.moveContext.propertyType} />
          <SummaryItem label="Move window" value={summary.moveContext.moveWindow} />
          <SummaryItem label="Origin" value={summary.moveContext.originPostcode} />
          <SummaryItem label="Destination" value={summary.moveContext.destinationPostcode} />
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white">Room summary</h3>
          <div className="mt-4 grid gap-3">
            {summary.roomSummaries.map((room) => (
              <div
                key={room.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{room.name}</h4>
                    <p className="mt-1 text-xs text-slate-400">{room.mediaCount} media items</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {room.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{room.notes || "No room notes yet."}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Mover preview shape</p>
        <h2 className="mt-4 text-2xl font-semibold text-white">First review packet</h2>
        <div className="mt-6 grid gap-4">
          <SummaryItem
            label="Inventory status"
            value={summary.moverPreview.structuredInventoryStatus.replaceAll("_", " ")}
          />
          <SummaryItem
            label="Ready for mover preview"
            value={summary.completeness.readyForMoverPreview ? "Yes" : "Not yet"}
          />
          <SummaryItem
            label="Completed rooms"
            value={`${summary.completeness.completedRooms} / ${summary.completeness.totalRooms}`}
          />
          <SummaryItem
            label="Rooms with media"
            value={`${summary.completeness.roomsWithMedia} / ${summary.completeness.totalRooms}`}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white">Notes for mover</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {summary.moverPreview.notesForMover || "No mover notes added yet."}
          </p>
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
