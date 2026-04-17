import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { SectionCard } from "@/components/ui/section-card";
import { SurveyList } from "@/components/survey/survey-list";

export default async function SurveyListPage() {
  const surveys = await prisma.survey.findMany({
    include: {
      rooms: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">
                Survey drafts
              </p>
              <h1 className="mt-4 text-3xl font-semibold text-white">
                Draft list and handoff view
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                This is the internal product flow checkpoint before uploads. It lets us
                inspect draft surveys, selected rooms, and readiness for per-room media capture.
              </p>
            </div>
            <Link
              href="/survey"
              className="rounded-full bg-violet-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-400"
            >
              Create another survey
            </Link>
          </div>

          <div className="mt-8">
            <SurveyList surveys={surveys} />
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
