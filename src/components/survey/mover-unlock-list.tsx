import { SectionCard } from "@/components/ui/section-card";

type UnlockListProps = {
  unlocks: {
    id: string;
    moverEmail: string;
    companyName: string | null;
    status: string;
    invitedAt: string | Date;
    viewedAt: string | Date | null;
    unlockedAt: string | Date | null;
  }[];
};

export function MoverUnlockList({ unlocks }: UnlockListProps) {
  return (
    <SectionCard>
      <h3 className="text-lg font-semibold text-white">Mover unlock records</h3>
      <div className="mt-4 grid gap-3">
        {unlocks.length ? (
          unlocks.map((unlock) => (
            <div key={unlock.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">{unlock.companyName || unlock.moverEmail}</p>
                  <p className="mt-1 text-xs text-slate-400">{unlock.moverEmail}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {unlock.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
            No mover unlock records yet.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
