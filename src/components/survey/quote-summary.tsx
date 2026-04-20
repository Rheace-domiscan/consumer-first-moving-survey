import type { ReactNode } from "react";
import { SectionCard } from "@/components/ui/section-card";
import type { SurveyPackage } from "@/lib/survey-package";

export function QuoteSummary({ surveyPackage }: { surveyPackage: SurveyPackage }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Consumer summary</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Quote-ready survey summary</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            This is the owner-side package the mover workflow is built from: structured room coverage,
            AI-assisted item extraction, and explicit confidence/completeness cues.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <SummaryItem label="Property type" value={surveyPackage.moveContext.propertyType} />
            <SummaryItem label="Move window" value={surveyPackage.moveContext.moveWindow} />
            <SummaryItem label="Origin" value={surveyPackage.moveContext.originPostcode} />
            <SummaryItem label="Destination" value={surveyPackage.moveContext.destinationPostcode} />
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">Move notes</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {surveyPackage.moveContext.overallNotes || "No overall move notes added yet."}
            </p>
          </div>
        </SectionCard>

        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Mover package quality</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Readiness and confidence</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SummaryItem label="Completeness" value={surveyPackage.coverage.completenessStatus} />
            <SummaryItem
              label="Confidence"
              value={`${surveyPackage.coverage.confidenceTier} (${surveyPackage.coverage.confidenceScore}/100)`}
            />
            <SummaryItem
              label="Completed rooms"
              value={`${surveyPackage.coverage.completedRooms} / ${surveyPackage.coverage.totalRooms}`}
            />
            <SummaryItem
              label="Rooms with media"
              value={`${surveyPackage.coverage.roomsWithMedia} / ${surveyPackage.coverage.totalRooms}`}
            />
            <SummaryItem
              label="Mover usefulness"
              value={surveyPackage.coverage.surveyUsefulness}
            />
            <SummaryItem
              label="Indicative item count"
              value={surveyPackage.coverage.indicativeMajorItemCountBand}
            />
          </div>

          <div className="mt-6 space-y-3">
            {surveyPackage.coverage.reviewReasons.map((reason) => (
              <div
                key={reason}
                className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
              >
                {reason}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Operational signals</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Volume, packing, and handling</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SummaryItem
              label="Estimated move volume"
              value={`${surveyPackage.majorItemSummary.totalEstimatedCubeFeet} cu ft / ${surveyPackage.majorItemSummary.totalEstimatedCubeMeters} m³`}
            />
            <SummaryItem
              label="Volume band"
              value={surveyPackage.majorItemSummary.estimatedVolumeBand}
            />
            <SummaryItem
              label="Structured items surfaced"
              value={String(surveyPackage.majorItemSummary.totalItems)}
            />
            <SummaryItem
              label="Mover preview ready"
              value={surveyPackage.coverage.readyForMoverPreview ? "Yes" : "Not yet"}
            />
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-white">Packing guidance</h3>
            <div className="mt-4 grid gap-3">
              {surveyPackage.packingGuidance.length ? (
                surveyPackage.packingGuidance.map((guidance) => (
                  <div key={guidance.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{guidance.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{guidance.reason}</p>
                  </div>
                ))
              ) : (
                <EmptyState body="Packing guidance will appear once major items or handling notes are present." />
              )}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-white">Special handling flags</h3>
            <div className="mt-4 grid gap-3">
              {surveyPackage.specialHandlingFlags.length ? (
                surveyPackage.specialHandlingFlags.map((flag) => (
                  <div key={flag} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {flag}
                  </div>
                ))
              ) : (
                <EmptyState body="No special handling flags have been triggered yet." />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Legend</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">How movers should read this package</h2>
          <div className="mt-6 grid gap-3">
            {surveyPackage.legend.map((entry) => (
              <div key={entry.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{entry.label}</p>
                <p className="mt-2 text-sm text-slate-300">{entry.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Room-by-room package</p>
        <h2 className="mt-4 text-2xl font-semibold text-white">Structured mover review</h2>
        <div className="mt-6 grid gap-4">
          {surveyPackage.roomPackages.map((room) => (
            <div key={room.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{room.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {room.mediaCount} media item{room.mediaCount === 1 ? "" : "s"} linked
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill>{room.status.replaceAll("_", " ")}</Pill>
                  <Pill>{room.coverageNote}</Pill>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Structured items</p>
                  <div className="mt-3 grid gap-3">
                    {room.items.length ? (
                      room.items.map((item) => (
                        <div key={`${room.id}-${item.source}-${item.label}`} className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <div className="flex flex-wrap gap-2">
                              <Pill>{item.source}</Pill>
                              <Pill>{item.confidenceTier}</Pill>
                              {item.reviewRecommended ? <Pill>Review recommended</Pill> : null}
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">
                            {item.estimatedCubeFeet
                              ? `Estimated contribution: ${item.estimatedCubeFeet} cu ft / ${item.estimatedCubeMeters} m³`
                              : "No rules-based volume estimate attached yet."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState body="No structured items surfaced for this room yet." />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Room notes</p>
                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                      {room.notes || "No room-specific notes yet."}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Media files</p>
                    <div className="mt-3 grid gap-2">
                      {room.mediaFiles.length ? (
                        room.mediaFiles.map((media) => (
                          <div
                            key={media.id}
                            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200"
                          >
                            <p className="font-medium text-white">{media.fileName}</p>
                            <p className="mt-1 text-xs text-slate-400">{media.kind}</p>
                          </div>
                        ))
                      ) : (
                        <EmptyState body="No files attached to this room yet." />
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
