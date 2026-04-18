import { SectionCard } from "@/components/ui/section-card";

type PersistedPreviewProps = {
  jobs: {
    id: string;
    status: string;
    mode: string;
    media: {
      fileName: string;
    };
    result: {
      needsReview: boolean;
      observedJson: string;
      declaredJson: string;
    } | null;
  }[];
};

export function ExtractionPersistedPreview({ jobs }: PersistedPreviewProps) {
  return (
    <div className="grid gap-4">
      {jobs.length ? (
        jobs.map((job) => {
          const observed = job.result ? (JSON.parse(job.result.observedJson) as { label: string; confidence: number }[]) : [];
          const declared = job.result ? (JSON.parse(job.result.declaredJson) as { label: string }[]) : [];

          return (
            <SectionCard key={job.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{job.media.fileName}</h3>
                  <p className="mt-1 text-xs text-slate-400">{job.mode}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {job.status}
                </span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Observed</p>
                  <div className="mt-3 space-y-2">
                    {observed.length ? (
                      observed.map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                          {item.label} ({Math.round(item.confidence * 100)}%)
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-400">
                        No observed items.
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Declared</p>
                  <div className="mt-3 space-y-2">
                    {declared.length ? (
                      declared.map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                          {item.label}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-400">
                        No declared items.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-amber-200">
                {job.result?.needsReview ? "Needs review before mover-facing use." : "Ready for downstream use."}
              </p>
            </SectionCard>
          );
        })
      ) : (
        <SectionCard>
          <p className="text-sm text-slate-400">No extraction jobs have been persisted yet.</p>
        </SectionCard>
      )}
    </div>
  );
}
