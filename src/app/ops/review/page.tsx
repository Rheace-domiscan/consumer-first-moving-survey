import Link from "next/link";
import { getClerkUserSummaries } from "@/lib/clerk-users";
import { APP_ROLES, requirePageRole } from "@/lib/authz";
import {
  getOpsSurveyReviewStats,
  listOpsSurveyReviewPage,
  type OpsSurveyReviewListRecord,
  type OpsSurveyReviewView,
} from "@/lib/surveys/repository";
import { formatDateTime } from "@/lib/format";
import { Header } from "@/components/layout/header";
import { SectionCard } from "@/components/ui/section-card";

const VIEW_OPTIONS: Array<{ value: OpsSurveyReviewView; label: string }> = [
  { value: "all", label: "All surveys" },
  { value: "review", label: "Needs review" },
  { value: "unlocked", label: "Unlocked" },
  { value: "archived", label: "Archived" },
  { value: "exempt", label: "Exempt" },
];

export default async function OpsReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; view?: string }>;
}) {
  const access = await requirePageRole(APP_ROLES.OPERATOR);
  const query = (await searchParams) ?? {};
  const view = parseView(query.view);
  const page = parsePage(query.page);
  const [stats, reviewPage] = await Promise.all([
    getOpsSurveyReviewStats(),
    listOpsSurveyReviewPage({ view, page }),
  ]);
  const owners = await getClerkUserSummaries(reviewPage.surveys.map((survey) => survey.ownerClerkUserId));

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Ops console</p>
              <h1 className="mt-4 text-3xl font-semibold text-white">Survey review and retention queue</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                Operators and admins can triage the queue quickly here, then open a dedicated review
                page for the full survey package, audit trail, and retention controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {access.isAdmin ? (
                <Link
                  href="/ops/settings"
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                >
                  Open admin settings
                </Link>
              ) : null}
              {access.isAdmin ? (
                <Link
                  href="/ops/health"
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                >
                  Open ops health
                </Link>
              ) : null}
              <Link
                href="/survey/list"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
              >
                Back to drafts
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            <Metric label="Total surveys" value={String(stats.totalSurveys)} />
            <Metric label="Needs review" value={String(stats.needsReviewCount)} />
            <Metric label="Archived" value={String(stats.archivedCount)} />
            <Metric label="Exempt" value={String(stats.exemptCount)} />
            <Metric label="Unlocked surveys" value={String(stats.unlockedCount)} />
          </div>
        </SectionCard>

        <SectionCard className="mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Queue filters</h2>
              <p className="mt-2 text-sm text-slate-300">
                Showing {reviewPage.totalCount} survey{reviewPage.totalCount === 1 ? "" : "s"} in the{" "}
                {VIEW_OPTIONS.find((option) => option.value === view)?.label.toLowerCase()} view.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {VIEW_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={buildReviewHref({ view: option.value, page: 1 })}
                  className={
                    option.value === view
                      ? "rounded-full border border-violet-300/40 bg-violet-500/15 px-4 py-2 text-sm font-medium text-white"
                      : "rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                  }
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="mt-6 grid gap-6">
          {reviewPage.surveys.length ? (
            reviewPage.surveys.map((survey) => {
              const owner = owners.get(survey.ownerClerkUserId) ?? null;
              const snapshot = deriveQueueSnapshot(survey);

              return (
                <SectionCard key={survey.id}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-violet-200/80">
                        Survey {survey.id}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{survey.title || "Untitled survey"}</h2>
                      <p className="mt-3 text-sm text-slate-300">
                        Owner: {owner?.displayName ?? survey.ownerClerkUserId}
                        {owner?.email ? ` • ${owner.email}` : ""}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Updated {formatDateTime(survey.updatedAt)}. {snapshot.summary}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/ops/review/${survey.id}`}
                        className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                      >
                        Open review detail
                      </Link>
                      {access.userId === survey.ownerClerkUserId ? (
                        <Link
                          href={`/survey/${survey.id}/summary`}
                          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                        >
                          Owner summary
                        </Link>
                      ) : null}
                      {survey.shareToken ? (
                        <Link
                          href={`/shared/${survey.shareToken}`}
                          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                        >
                          Shared preview
                        </Link>
                      ) : (
                        <span className="rounded-full border border-white/5 px-4 py-2 text-sm font-medium text-slate-500">
                          Shared preview unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                    <Metric label="Rooms" value={`${snapshot.completedRooms}/${snapshot.totalRooms} complete`} />
                    <Metric label="Coverage" value={`${snapshot.roomsWithMedia}/${snapshot.totalRooms} with media`} />
                    <Metric label="Extraction" value={snapshot.extractionSummary} />
                    <Metric label="Review" value={snapshot.needsReview ? "Needs review" : "Clear"} />
                    <Metric label="Mover unlocks" value={`${snapshot.unlockedCount}/${snapshot.totalUnlocks}`} />
                    <Metric label="Retention state" value={survey.retentionState} />
                  </div>

                  {snapshot.signals.length ? (
                    <div className="mt-6 grid gap-3">
                      {snapshot.signals.map((signal) => (
                        <div
                          key={signal}
                          className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                        >
                          {signal}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6">
                      <EmptyState body="No immediate review signals are attached to this survey in the queue view." />
                    </div>
                  )}
                </SectionCard>
              );
            })
          ) : (
            <SectionCard>
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
                No surveys are available in the ops queue.
              </div>
            </SectionCard>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            Page {reviewPage.page} of {reviewPage.totalPages}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={buildReviewHref({ view, page: Math.max(1, reviewPage.page - 1) })}
              aria-disabled={reviewPage.page === 1}
              className={
                reviewPage.page === 1
                  ? "pointer-events-none rounded-full border border-white/5 px-4 py-2 text-sm font-medium text-slate-500"
                  : "rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
              }
            >
              Previous
            </Link>
            <Link
              href={buildReviewHref({ view, page: Math.min(reviewPage.totalPages, reviewPage.page + 1) })}
              aria-disabled={reviewPage.page === reviewPage.totalPages}
              className={
                reviewPage.page === reviewPage.totalPages
                  ? "pointer-events-none rounded-full border border-white/5 px-4 py-2 text-sm font-medium text-slate-500"
                  : "rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
              }
            >
              Next
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function parseView(value?: string): OpsSurveyReviewView {
  if (value === "review" || value === "archived" || value === "exempt" || value === "unlocked") {
    return value;
  }

  return "all";
}

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

function buildReviewHref(input: { view: OpsSurveyReviewView; page: number }) {
  const search = new URLSearchParams();

  if (input.view !== "all") {
    search.set("view", input.view);
  }

  if (input.page > 1) {
    search.set("page", String(input.page));
  }

  const query = search.toString();
  return query ? `/ops/review?${query}` : "/ops/review";
}

function deriveQueueSnapshot(survey: OpsSurveyReviewListRecord) {
  const totalRooms = survey.rooms.length;
  const completedRooms = survey.rooms.filter((room) => room.status === "COMPLETE").length;
  const roomsWithMedia = survey.rooms.filter((room) => room.mediaCount > 0).length;
  const pendingJobs = survey.extractionJobs.filter((job) => job.status === "PENDING").length;
  const processingJobs = survey.extractionJobs.filter((job) => job.status === "PROCESSING").length;
  const failedJobs = survey.extractionJobs.filter((job) => job.status === "FAILED").length;
  const reviewResults = survey.extractionJobs.filter((job) => job.result?.needsReview).length;
  const unlockedCount = survey.moverUnlocks.filter((unlock) => unlock.status === "UNLOCKED").length;
  const totalUnlocks = survey.moverUnlocks.length;
  const signals: string[] = [];

  if (roomsWithMedia < totalRooms) {
    signals.push(`${totalRooms - roomsWithMedia} room${totalRooms - roomsWithMedia === 1 ? "" : "s"} still have no uploaded media.`);
  }

  if (completedRooms < totalRooms) {
    signals.push(`${totalRooms - completedRooms} room${totalRooms - completedRooms === 1 ? "" : "s"} are not marked complete yet.`);
  }

  if (pendingJobs || processingJobs) {
    signals.push(`Extraction still has ${pendingJobs + processingJobs} queued or active job${pendingJobs + processingJobs === 1 ? "" : "s"}.`);
  }

  if (failedJobs) {
    signals.push(`${failedJobs} extraction job${failedJobs === 1 ? "" : "s"} failed and need operator follow-up.`);
  }

  if (reviewResults) {
    signals.push(`${reviewResults} extraction result${reviewResults === 1 ? "" : "s"} are flagged for review.`);
  }

  return {
    totalRooms,
    completedRooms,
    roomsWithMedia,
    unlockedCount,
    totalUnlocks,
    extractionSummary: `${pendingJobs + processingJobs} active • ${failedJobs} failed`,
    needsReview: signals.length > 0,
    signals,
    summary:
      signals.length > 0
        ? `${signals.length} review signal${signals.length === 1 ? "" : "s"} detected in the queue view.`
        : "No immediate queue-level issues are visible.",
  };
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
