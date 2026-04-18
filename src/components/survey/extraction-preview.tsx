import { SectionCard } from "@/components/ui/section-card";

type ExtractionPreviewProps = {
  queue: {
    mediaId: string;
    fileName: string;
    extractionMode: string;
    status: string;
  }[];
  results: {
    roomId: string;
    observedItems: { label: string; confidence: number; source: "observed" }[];
    declaredItems: { label: string; source: "declared" }[];
    needsReview: boolean;
  }[];
};

export function ExtractionPreview({ queue, results }: ExtractionPreviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <SectionCard>
        <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">AI extraction prep</p>
        <h2 className="mt-4 text-2xl font-semibold text-white">Queue shape</h2>
        <div className="mt-6 grid gap-3">
          {queue.length > 0 ? (
            queue.map((item) => (
              <div key={item.mediaId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{item.fileName}</p>
                <p className="mt-2 text-xs text-slate-400">{item.extractionMode}</p>
                <p className="mt-2 text-xs text-violet-200">{item.status}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
              No queued media yet.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard>
        <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Declared vs observed</p>
        <h2 className="mt-4 text-2xl font-semibold text-white">Placeholder extraction results</h2>
        <div className="mt-6 grid gap-4">
          {results.map((result) => (
            <div key={result.roomId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-white">Room {result.roomId}</p>
                <span className="rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-200">
                  {result.needsReview ? "Needs review" : "Ready"}
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Observed</p>
                  <div className="mt-3 space-y-2">
                    {result.observedItems.length ? (
                      result.observedItems.map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
                          {item.label} ({Math.round(item.confidence * 100)}%)
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/30 px-3 py-2 text-sm text-slate-400">
                        No observed items yet.
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Declared</p>
                  <div className="mt-3 space-y-2">
                    {result.declaredItems.length ? (
                      result.declaredItems.map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
                          {item.label}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/30 px-3 py-2 text-sm text-slate-400">
                        No declared items yet.
                      </div>
                    )}
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
