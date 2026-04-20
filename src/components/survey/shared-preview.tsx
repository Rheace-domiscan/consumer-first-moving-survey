import type { ReactNode } from "react";
import { SectionCard } from "@/components/ui/section-card";
import type { SurveyPackage } from "@/lib/survey-package";

export function SharedPreview({
  surveyPackage,
  unlocked,
}: {
  surveyPackage: SurveyPackage;
  unlocked: boolean;
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Mover preview</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">{surveyPackage.surveyTitle}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {unlocked
              ? "This survey has been unlocked. The full structured mover package is now visible below."
              : "This is the commercial preview layer. Unlock to review the full structured move package, room-level items, and mover-facing guidance."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <SummaryItem label="Property type" value={surveyPackage.moveContext.propertyType} />
            <SummaryItem label="Move window" value={surveyPackage.moveContext.moveWindow} />
            <SummaryItem label="Origin" value={surveyPackage.moveContext.originPostcode} />
            <SummaryItem label="Destination" value={surveyPackage.moveContext.destinationPostcode} />
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold text-white">Move notes</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {surveyPackage.moveContext.overallNotes || "No overall survey notes provided yet."}
            </p>
          </div>
        </SectionCard>

        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Preview before unlock</p>
          <div className="mt-6 grid gap-4">
            <SummaryItem label="Completeness" value={surveyPackage.coverage.completenessStatus} />
            <SummaryItem
              label="Confidence"
              value={`${surveyPackage.coverage.confidenceTier} (${surveyPackage.coverage.confidenceScore}/100)`}
            />
            <SummaryItem
              label="Survey usefulness"
              value={surveyPackage.coverage.surveyUsefulness}
            />
            <SummaryItem
              label="Indicative items"
              value={surveyPackage.coverage.indicativeMajorItemCountBand}
            />
            <SummaryItem
              label="Estimated volume band"
              value={surveyPackage.majorItemSummary.estimatedVolumeBand}
            />
            <SummaryItem
              label="Coverage"
              value={`${surveyPackage.coverage.roomsWithMedia} of ${surveyPackage.coverage.totalRooms} rooms with media`}
            />
          </div>
        </SectionCard>
      </div>

      {unlocked ? (
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Unlocked mover review</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Structured review package</h2>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryItem
                  label="Structured items surfaced"
                  value={String(surveyPackage.majorItemSummary.totalItems)}
                />
                <SummaryItem
                  label="Estimated move volume"
                  value={`${surveyPackage.majorItemSummary.totalEstimatedCubeFeet} cu ft / ${surveyPackage.majorItemSummary.totalEstimatedCubeMeters} m³`}
                />
                <SummaryItem
                  label="Mover invites"
                  value={String(surveyPackage.moverUnlockSummary.totalInvites)}
                />
                <SummaryItem
                  label="Unlocked records"
                  value={String(surveyPackage.moverUnlockSummary.unlockedCount)}
                />
              </div>

              <div className="mt-6 space-y-3">
                {surveyPackage.specialHandlingFlags.length ? (
                  surveyPackage.specialHandlingFlags.map((flag) => (
                    <div key={flag} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                      {flag}
                    </div>
                  ))
                ) : (
                  <EmptyState body="No special handling flags surfaced for this survey." />
                )}
              </div>
            </div>

            <div className="grid gap-3">
              {surveyPackage.packingGuidance.length ? (
                surveyPackage.packingGuidance.map((guidance) => (
                  <div key={guidance.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{guidance.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{guidance.reason}</p>
                  </div>
                ))
              ) : (
                <EmptyState body="Packing guidance will appear when major items or special notes are present." />
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {surveyPackage.roomPackages.map((room) => (
              <div key={room.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{room.name}</h3>
                    <p className="mt-1 text-xs text-slate-400">{room.coverageNote}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill>{room.status.replaceAll("_", " ")}</Pill>
                    <Pill>{room.mediaCount} media</Pill>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3">
                    {room.items.length ? (
                      room.items.map((item) => (
                        <div key={`${room.id}-${item.source}-${item.label}`} className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <div className="flex flex-wrap gap-2">
                              <Pill>{item.source}</Pill>
                              <Pill>{item.confidenceTier}</Pill>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">
                            {item.estimatedCubeFeet
                              ? `Estimated contribution ${item.estimatedCubeFeet} cu ft`
                              : "No rules-based volume estimate yet."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState body="No structured items surfaced for this room yet." />
                    )}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    {room.notes || "No room-specific notes supplied."}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">What unlock reveals</p>
          <div className="mt-6 grid gap-3">
            {surveyPackage.legend.map((entry) => (
              <div key={entry.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{entry.label}</p>
                <p className="mt-2 text-sm text-slate-300">{entry.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
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

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
      {children}
    </span>
  );
}

function EmptyState({ body }: { body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-3 text-sm text-slate-400">
      {body}
    </div>
  );
}
