import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { SectionCard } from "@/components/ui/section-card";
import { UploadPanel } from "@/components/survey/upload-panel";

export default async function SurveyUploadPage({
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
        include: {
          media: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
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
          <Link href={`/survey/${survey.id}`} className="text-sm text-slate-300 transition hover:text-white">
            ← Back to survey draft
          </Link>
        </div>

        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">
            Upload capture
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white">
            Attach room media for {survey.title || "this survey"}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This is the first upload step. It records room-level media and is ready to
            point at Cloudflare R2 once credentials are configured.
          </p>

          <div className="mt-8">
            <UploadPanel surveyId={survey.id} rooms={survey.rooms} />
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
