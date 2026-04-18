import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ExtractionPersistedPreview } from "@/components/survey/extraction-persisted-preview";
import { ExtractionSyncButton } from "@/components/survey/extraction-sync-button";
import { ExtractionRunButton } from "@/components/survey/extraction-run-button";

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

  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      ownerClerkUserId: userId,
    },
    include: {
      extractionJobs: {
        include: {
          media: true,
          result: true,
        },
        orderBy: {
          createdAt: "desc",
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
          <Link href={`/survey/${survey.id}`} className="text-sm text-slate-300 transition hover:text-white">
            ← Back to survey draft
          </Link>
          <div className="flex flex-wrap gap-3">
            <ExtractionSyncButton surveyId={survey.id} />
            <ExtractionRunButton surveyId={survey.id} />
          </div>
        </div>
        <ExtractionPersistedPreview jobs={survey.extractionJobs} />
      </section>
    </main>
  );
}
