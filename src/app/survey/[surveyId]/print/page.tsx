import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { buildSurveyPackage } from "@/lib/survey-package";
import { getOwnerSurveyPackage } from "@/lib/surveys/repository";
import { QuoteSummary } from "@/components/survey/quote-summary";
import { PrintPackageActions } from "@/components/survey/print-package-actions";

export default async function SurveyPrintPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { surveyId } = await params;

  const survey = await getOwnerSurveyPackage({
    surveyId,
    userId,
  });

  if (!survey) {
    notFound();
  }

  const surveyPackage = buildSurveyPackage(survey);

  return (
    <main className="min-h-screen bg-white text-slate-950 print:bg-white">
      <section className="mx-auto max-w-6xl px-6 py-10 print:px-0">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link href={`/survey/${survey.id}/summary`} className="text-sm text-slate-600 transition hover:text-slate-950">
            ← Back to owner summary
          </Link>
          <PrintPackageActions />
        </div>
        <div className="print-package rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
          <div className="mb-8 border-b border-slate-200 pb-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Printable mover package</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{surveyPackage.surveyTitle}</h1>
            <p className="mt-2 text-sm text-slate-600">Survey id: {surveyPackage.surveyId}</p>
          </div>
          <QuoteSummary surveyPackage={surveyPackage} />
        </div>
      </section>
    </main>
  );
}
