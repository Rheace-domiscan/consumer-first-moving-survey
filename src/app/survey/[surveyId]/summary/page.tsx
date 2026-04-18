import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildQuoteReadySummary } from "@/lib/survey-output";
import { Header } from "@/components/layout/header";
import { QuoteSummary } from "@/components/survey/quote-summary";

export default async function SurveySummaryPage({
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

  const summary = buildQuoteReadySummary(survey);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href={`/survey/${survey.id}`} className="text-sm text-slate-300 transition hover:text-white">
            ← Back to survey draft
          </Link>
          <Link
            href={`/mover?survey=${survey.id}`}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
          >
            View mover preview shape
          </Link>
        </div>
        <QuoteSummary summary={summary} />
      </section>
    </main>
  );
}
