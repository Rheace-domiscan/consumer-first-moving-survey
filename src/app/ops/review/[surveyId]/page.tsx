import Link from "next/link";
import { notFound } from "next/navigation";
import { buildSurveyPackage } from "@/lib/survey-package";
import { getClerkUserSummaries } from "@/lib/clerk-users";
import { APP_ROLES, requirePageRole } from "@/lib/authz";
import { getOrCreateGlobalRetentionPolicy, resolveSurveyRetention } from "@/lib/retention";
import { getOpsSurveyReviewDetail } from "@/lib/surveys/repository";
import { formatDateTime } from "@/lib/format";
import { Header } from "@/components/layout/header";
import { SurveyRetentionControls } from "@/components/ops/survey-retention-controls";
import { SectionCard } from "@/components/ui/section-card";

export default async function OpsReviewDetailPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const access = await requirePageRole(APP_ROLES.OPERATOR);
  const { surveyId } = await params;
  const [policy, survey] = await Promise.all([
    getOrCreateGlobalRetentionPolicy(),
    getOpsSurveyReviewDetail(surveyId),
  ]);

  if (!survey) {
    notFound();
  }

  const surveyPackage = buildSurveyPackage(survey);
  const retention = resolveSurveyRetention(policy, survey);
  const owners = await getClerkUserSummaries([survey.ownerClerkUserId]);
  const owner = owners.get(survey.ownerClerkUserId) ?? null;

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Ops review detail</p>
              <h1 className="mt-4 text-3xl font-semibold text-white">{surveyPackage.surveyTitle}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                Owner: {owner?.displayName ?? survey.ownerClerkUserId}
                {owner?.email ? ` • ${owner.email}` : ""}. Updated {formatDateTime(survey.updatedAt)}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ops/review"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
              >
                Back to queue
              </Link>
              {access.userId === survey.ownerClerkUserId ? (
                <Link
                  href={`/survey/${survey.id}/summary`}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                >
                  Owner summary
                </Link>
              ) : null}
              {survey.shareToken ? (
                <Link
                  href={`/shared/${survey.shareToken}`}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                >
                  Shared preview
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Completeness" value={surveyPackage.coverage.completenessStatus} />
            <Metric
              label="Confidence"
              value={`${surveyPackage.coverage.confidenceTier} (${surveyPackage.coverage.confidenceScore}/100)`}
            />
            <Metric
              label="Coverage"
              value={`${surveyPackage.coverage.roomsWithMedia}/${surveyPackage.coverage.totalRooms} rooms with media`}
            />
            <Metric
              label="Mover unlocks"
              value={`${surveyPackage.moverUnlockSummary.unlockedCount}/${surveyPackage.moverUnlockSummary.totalInvites}`}
            />
            <Metric label="Retention state" value={survey.retentionState} />
          </div>
        </SectionCard>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard>
            <h2 className="text-xl font-semibold text-white">Review reasons</h2>
            <div className="mt-4 grid gap-3">
              {surveyPackage.coverage.reviewReasons.length ? (
                surveyPackage.coverage.reviewReasons.map((reason) => (
                  <div
                    key={reason}
                    className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                  >
                    {reason}
                  </div>
                ))
              ) : (
                <EmptyState body="No explicit review reasons are currently attached." />
              )}
            </div>

            <h3 className="mt-6 text-sm font-semibold text-white">Retention timing</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Metric label="Archive due" value={retention.archiveDueAt ? formatDateTime(retention.archiveDueAt) : "Not applicable"} />
              <Metric label="Purge due" value={retention.purgeDueAt ? formatDateTime(retention.purgeDueAt) : "Not applicable"} />
              <Metric label="Media due" value={retention.mediaPurgeDueAt ? formatDateTime(retention.mediaPurgeDueAt) : "Not applicable"} />
            </div>
            {retention.exemptReason ? (
              <p className="mt-3 rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
                Exempt reason: {retention.exemptReason}
              </p>
            ) : null}

            <div className="mt-6">
              <SurveyRetentionControls
                surveyId={survey.id}
                state={survey.retentionState}
                initialArchiveAfterDays={survey.retentionArchiveAfterDays}
                initialPurgeAfterDays={survey.retentionPurgeAfterDays}
                initialExemptReason={survey.retentionExemptReason}
                canPurge={access.isAdmin}
              />
            </div>
          </SectionCard>

          <SectionCard>
            <h2 className="text-xl font-semibold text-white">Recent mover / audit activity</h2>
            <div className="mt-4 grid gap-3">
              {surveyPackage.auditTrail.length ? (
                surveyPackage.auditTrail.slice(0, 8).map((event) => (
                  <div key={event.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <p className="font-medium text-white">{event.eventType.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {event.actorType} • {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState body="No audit events recorded for this survey yet." />
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
