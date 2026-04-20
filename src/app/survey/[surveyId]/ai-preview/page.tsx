import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getOwnerSurveyAiPreview } from "@/lib/surveys/repository";
import { Header } from "@/components/layout/header";
import { ExtractionPersistedPreview } from "@/components/survey/extraction-persisted-preview";
import { ExtractionSyncButton } from "@/components/survey/extraction-sync-button";
import { ExtractionRunButton } from "@/components/survey/extraction-run-button";
import { SectionCard } from "@/components/ui/section-card";

export default async function SurveyAiPreviewPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { surveyId } = await params;

  const survey = await getOwnerSurveyAiPreview({
    surveyId,
    userId,
  });

  if (!survey) {
    notFound();
  }

  const totalUploadedMedia = survey.rooms.reduce((sum, room) => sum + room.media.length, 0);
  const roomsWithMedia = survey.rooms.filter((room) => room.media.length > 0).length;
  const hasUploadedMedia = totalUploadedMedia > 0;
  const hasExtractionJobs = survey.extractionJobs.length > 0;
  const pendingJobs = survey.extractionJobs.filter((job) => job.status === "PENDING").length;
  const processingJobs = survey.extractionJobs.filter((job) => job.status === "PROCESSING").length;
  const failedJobs = survey.extractionJobs.filter((job) => job.status === "FAILED").length;
  const completeJobs = survey.extractionJobs.filter((job) => job.status === "COMPLETE").length;

  const syncDisabledReason = hasUploadedMedia
    ? null
    : "Upload at least one room photo or video before syncing extraction artifacts.";
  const runDisabledReason = hasExtractionJobs
    ? null
    : hasUploadedMedia
      ? "Sync extraction artifacts first so the worker has queued media to claim."
      : "AI processing starts after room media is uploaded and synced.";

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href={`/survey/${survey.id}`} className="text-sm text-slate-300 transition hover:text-white">
            ← Back to survey draft
          </Link>
          <div className="flex flex-wrap gap-3">
            <ExtractionSyncButton
              surveyId={survey.id}
              disabledReason={syncDisabledReason}
              helperText="Create or refresh extraction jobs from uploaded room media."
            />
            <ExtractionRunButton
              surveyId={survey.id}
              disabledReason={runDisabledReason}
              helperText="Claim queued jobs immediately and run the local extraction worker for this survey."
            />
          </div>
        </div>
        <SectionCard className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-violet-200/80">AI prep readiness</p>
              <h1 className="mt-3 text-2xl font-semibold text-white">Extraction pipeline status</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                This view only becomes useful after room media is uploaded. Sync turns media into extraction jobs; the
                processor then generates draft observed items for review.
              </p>
            </div>
            <div className="grid min-w-[240px] gap-3 sm:grid-cols-3">
              <Metric label="Rooms with media" value={`${roomsWithMedia} / ${survey.rooms.length}`} />
              <Metric label="Uploaded files" value={String(totalUploadedMedia)} />
              <Metric label="Queued / active" value={`${pendingJobs + processingJobs} / ${survey.extractionJobs.length}`} />
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-7 text-slate-200">
            {hasExtractionJobs
              ? "Extraction jobs exist for this survey. Sync refreshes fingerprints and declared-note stubs; run claims queued work immediately, while the standalone worker can also poll the same queue in the background."
              : hasUploadedMedia
                ? "Uploaded media is ready, but nothing has been queued yet. Use Sync extraction artifacts to create the jobs."
                : "No uploaded media is attached to this survey yet. Start from the upload flow, attach at least one photo or video, then return here to sync and run extraction."}
          </div>
          {hasExtractionJobs ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Metric label="Pending" value={String(pendingJobs)} />
              <Metric label="Processing" value={String(processingJobs)} />
              <Metric label="Complete" value={String(completeJobs)} />
              <Metric label="Failed" value={String(failedJobs)} />
            </div>
          ) : null}
        </SectionCard>
        <ExtractionPersistedPreview hasUploadedMedia={hasUploadedMedia} jobs={survey.extractionJobs} />
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}
