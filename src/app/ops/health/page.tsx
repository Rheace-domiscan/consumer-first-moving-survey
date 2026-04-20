import { prisma } from "@/lib/prisma";
import { APP_ROLES, requirePageRole } from "@/lib/authz";
import { Header } from "@/components/layout/header";
import { SectionCard } from "@/components/ui/section-card";

export default async function OpsHealthPage() {
  await requirePageRole(APP_ROLES.ADMIN);

  const [
    extractionPending,
    extractionProcessing,
    extractionFailed,
    oldestPendingJob,
    latestWorkerRuns,
    latestRetentionRun,
    failedWebhooks,
    recentWebhooks,
    activeCompanies,
    activeSubscriptions,
    pastDueSubscriptions,
  ] = await Promise.all([
    prisma.extractionJob.count({ where: { status: "PENDING" } }),
    prisma.extractionJob.count({ where: { status: "PROCESSING" } }),
    prisma.extractionJob.count({ where: { status: "FAILED" } }),
    prisma.extractionJob.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        media: {
          include: {
            surveyRoom: {
              include: {
                survey: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.backgroundJobRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.retentionRun.findFirst({
      orderBy: { createdAt: "desc" },
    }),
    prisma.providerWebhookEvent.count({
      where: { status: "FAILED" },
    }),
    prisma.providerWebhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.company.count({
      where: {
        status: "ACTIVE",
      },
    }),
    prisma.company.count({
      where: {
        subscriptionStatus: {
          in: ["ACTIVE", "TRIALING"],
        },
      },
    }),
    prisma.company.count({
      where: {
        subscriptionStatus: "PAST_DUE",
      },
    }),
  ]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Ops health</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">System health and background jobs</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This view tracks the queue depth, webhook reliability, company billing posture,
            and the latest background-job runs that keep the product operating.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Metric label="Pending extraction" value={String(extractionPending)} />
            <Metric label="Processing extraction" value={String(extractionProcessing)} />
            <Metric label="Failed extraction" value={String(extractionFailed)} />
            <Metric label="Failed webhooks" value={String(failedWebhooks)} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Metric label="Active companies" value={String(activeCompanies)} />
            <Metric label="Active subscriptions" value={String(activeSubscriptions)} />
            <Metric label="Past-due subscriptions" value={String(pastDueSubscriptions)} />
          </div>
        </SectionCard>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard>
            <h2 className="text-xl font-semibold text-white">Extraction queue</h2>
            {oldestPendingJob ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p className="font-medium text-white">Oldest pending job</p>
                <p className="mt-2">
                  {oldestPendingJob.media.surveyRoom.survey.title || "Untitled survey"} •{" "}
                  {oldestPendingJob.media.surveyRoom.name} • {oldestPendingJob.media.fileName}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Queued {new Date(oldestPendingJob.createdAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <EmptyState body="No pending extraction work is waiting in the queue." />
            )}

            <h3 className="mt-6 text-sm font-semibold text-white">Recent worker runs</h3>
            <div className="mt-3 grid gap-3">
              {latestWorkerRuns.length ? (
                latestWorkerRuns.map((run) => (
                  <div key={run.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <p className="font-medium text-white">
                      {run.jobType} • {run.status}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Processed {run.processedCount} • Failed {run.failedCount} • Started{" "}
                      {new Date(run.startedAt).toLocaleString()}
                    </p>
                    {run.notes ? <p className="mt-2 text-xs text-slate-400">{run.notes}</p> : null}
                  </div>
                ))
              ) : (
                <EmptyState body="No extraction worker runs have been recorded yet." />
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <h2 className="text-xl font-semibold text-white">Retention and Stripe webhooks</h2>
            {latestRetentionRun ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p className="font-medium text-white">Latest retention sweep</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(latestRetentionRun.createdAt).toLocaleString()} • Archived {latestRetentionRun.archivedCount} • Purged {latestRetentionRun.purgedCount}
                </p>
              </div>
            ) : (
              <EmptyState body="Retention has not been run yet." />
            )}

            <h3 className="mt-6 text-sm font-semibold text-white">Recent webhook events</h3>
            <div className="mt-3 grid gap-3">
              {recentWebhooks.length ? (
                recentWebhooks.map((event) => (
                  <div key={event.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <p className="font-medium text-white">
                      {event.eventType} • {event.status}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(event.createdAt).toLocaleString()} • attempts {event.attempts}
                    </p>
                    {event.lastError ? <p className="mt-2 text-xs text-rose-300">{event.lastError}</p> : null}
                  </div>
                ))
              ) : (
                <EmptyState body="No webhook events have been recorded yet." />
              )}
            </div>
          </SectionCard>
        </div>
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

function EmptyState({ body }: { body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-400">
      {body}
    </div>
  );
}
