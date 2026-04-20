import { SectionCard } from "@/components/ui/section-card";

type PersistedPreviewProps = {
  hasUploadedMedia: boolean;
  jobs: {
    id: string;
    status: string;
    mode: string;
    attempts: number;
    processorVersion: string | null;
    lastError: string | null;
    media: {
      fileName: string;
    };
    result: {
      needsReview: boolean;
      confidenceScore: number;
      qualityTier: string | null;
      majorItemCount: number;
      observedJson: string;
      declaredJson: string;
      summaryJson: string | null;
      reviewReasonsJson: string | null;
    } | null;
  }[];
};

export function ExtractionPersistedPreview({
  hasUploadedMedia,
  jobs,
}: PersistedPreviewProps) {
  return (
    <div className="grid gap-4">
      {jobs.length ? (
        jobs.map((job) => {
          const observed = job.result ? (JSON.parse(job.result.observedJson) as { label: string; confidence: number }[]) : [];
          const declared = job.result ? (JSON.parse(job.result.declaredJson) as { label: string }[]) : [];
          const summary = job.result?.summaryJson
            ? (JSON.parse(job.result.summaryJson) as {
                analyzer?: string;
                pixelWidth?: number | null;
                pixelHeight?: number | null;
                durationSeconds?: number | null;
                framesAnalyzed?: number;
                topClassifications?: { identifier: string; confidence: number }[];
                detectedText?: string[];
                usedFallback?: boolean;
              })
            : null;
          const reviewReasons = job.result?.reviewReasonsJson
            ? (JSON.parse(job.result.reviewReasonsJson) as string[])
            : [];

          return (
            <SectionCard key={job.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{job.media.fileName}</h3>
                  <p className="mt-1 text-xs text-slate-400">{job.mode}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Attempts {job.attempts}
                    {job.processorVersion ? ` • ${job.processorVersion}` : ""}
                    {summary?.analyzer ? ` • ${summary.analyzer}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {job.status}
                </span>
              </div>
              {job.result ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Metric label="Confidence" value={`${job.result.confidenceScore}/100`} />
                  <Metric label="Quality" value={job.result.qualityTier ?? "Pending"} />
                  <Metric label="Major items" value={String(job.result.majorItemCount)} />
                </div>
              ) : null}
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
              {summary ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-300">
                  <p>
                    Media signals:
                    {summary.pixelWidth && summary.pixelHeight
                      ? ` ${summary.pixelWidth}×${summary.pixelHeight}`
                      : " size unavailable"}
                    {summary.durationSeconds ? ` • ${summary.durationSeconds.toFixed(1)}s video` : ""}
                    {summary.framesAnalyzed ? ` • ${summary.framesAnalyzed} frames analyzed` : ""}
                    {summary.usedFallback ? " • fallback logic used" : ""}
                  </p>
                  {summary.topClassifications?.length ? (
                    <p className="mt-2">
                      Top classifications:{" "}
                      {summary.topClassifications
                        .slice(0, 4)
                        .map((entry) => `${entry.identifier} (${Math.round(entry.confidence * 100)}%)`)
                        .join(", ")}
                    </p>
                  ) : null}
                  {summary.detectedText?.length ? (
                    <p className="mt-2">
                      OCR text: {summary.detectedText.slice(0, 3).join(" • ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {reviewReasons.length ? (
                <div className="mt-4 grid gap-2">
                  {reviewReasons.map((reason) => (
                    <div
                      key={reason}
                      className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              ) : null}
              {job.lastError ? (
                <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                  Last error: {job.lastError}
                </p>
              ) : null}
              <p className="mt-4 text-xs text-amber-200">
                {job.result?.needsReview ? "Needs review before mover-facing use." : "Ready for downstream use."}
              </p>
            </SectionCard>
          );
        })
      ) : (
        <SectionCard>
          <h3 className="text-base font-semibold text-white">No extraction jobs yet</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {hasUploadedMedia
              ? "Uploaded media is available, but extraction jobs have not been created yet. Sync extraction artifacts first, then run the processor."
              : "AI prep starts after at least one room photo or video is uploaded. Once media exists, sync extraction artifacts to queue it for processing."}
          </p>
        </SectionCard>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}
