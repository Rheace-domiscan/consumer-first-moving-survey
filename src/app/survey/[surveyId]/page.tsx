import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { SurveyDetail } from "@/components/survey/survey-detail";

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      rooms: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

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
          <Link
            href={`/survey/${survey.id}/upload`}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
          >
            Continue to uploads
          </Link>
        </div>
        <SurveyDetail survey={survey} />
      </section>
    </main>
  );
}
