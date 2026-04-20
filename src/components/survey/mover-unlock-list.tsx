import { SectionCard } from "@/components/ui/section-card";
import { MoverUnlockActions } from "@/components/survey/mover-unlock-actions";
import { formatMoney, hasActiveEntitlement } from "@/lib/payments";

type UnlockListProps = {
  surveyId: string;
  unlocks: {
    id: string;
    moverEmail: string;
    companyName: string | null;
    status: string;
    quotedPriceCents: number;
    currency: string;
    invitedAt: string | Date;
    viewedAt: string | Date | null;
    unlockedAt: string | Date | null;
    accessEntitlement: {
      status: string;
      expiresAt: string | Date | null;
      revokedAt: string | Date | null;
    } | null;
    unlockCharges: {
      id: string;
      provider: string;
      status: string;
      amountCents: number;
      currency: string;
      paidAt: string | Date | null;
    }[];
  }[];
};

export function MoverUnlockList({ surveyId, unlocks }: UnlockListProps) {
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
                  <p className="mt-2 text-xs text-slate-400">
                    Price {formatMoney(unlock.quotedPriceCents, unlock.currency)}
                    {unlock.unlockCharges[0]
                      ? ` • ${unlock.unlockCharges[0].provider} ${unlock.unlockCharges[0].status}`
                      : " • Payment not started"}
                    {hasActiveEntitlement(unlock.accessEntitlement) ? " • Access active" : ""}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {unlock.status}
                  </span>
                  <MoverUnlockActions surveyId={surveyId} unlockId={unlock.id} currentStatus={unlock.status} />
                </div>
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
