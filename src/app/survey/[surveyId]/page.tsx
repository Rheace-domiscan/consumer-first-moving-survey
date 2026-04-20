import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getOrCreateGlobalRetentionPolicy } from "@/lib/retention";
import { getOwnerSurveyDetail } from "@/lib/surveys/repository";
import { Header } from "@/components/layout/header";
import { SurveyDetail } from "@/components/survey/survey-detail";
import { AuditEventList } from "@/components/survey/audit-event-list";
import { StatusBanner } from "@/components/survey/status-banner";
import { DeleteSurveyButton } from "@/components/survey/delete-survey-button";

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { surveyId } = await params;
  const [survey, policy] = await Promise.all([
    getOwnerSurveyDetail({
      surveyId,
      userId,
    }),
    getOrCreateGlobalRetentionPolicy(),
  ]);

  if (!survey) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/survey/list" className="text-sm text-slate-300 transition hover:text-white">
            ← Back to drafts
          </Link>
          <div className="flex flex-wrap gap-3">
            {policy.allowOwnerDelete ? <DeleteSurveyButton surveyId={survey.id} /> : null}
            <Link
              href={`/survey/${survey.id}/summary`}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
            >
              View summary
            </Link>
            <Link
              href={`/survey/${survey.id}/upload`}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
            >
              Continue to uploads
            </Link>
            <Link
              href={`/survey/${survey.id}/ai-preview`}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
            >
              View AI prep
            </Link>
          </div>
        </div>
        <div className="mb-6">
          <StatusBanner readinessState={survey.readinessState} status={survey.status} />
        </div>
        <SurveyDetail survey={survey} />
        <div className="mt-6">
          <AuditEventList events={survey.auditEvents} />
        </div>
      </section>
    </main>
  );
}
