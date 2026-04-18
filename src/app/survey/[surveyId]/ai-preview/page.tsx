import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildExtractionQueue, buildPlaceholderExtractionResult } from "@/lib/extraction";
import { Header } from "@/components/layout/header";
import { ExtractionPreview } from "@/components/survey/extraction-preview";

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

  const queue = buildExtractionQueue(
    survey.rooms.flatMap((room) =>
      room.media.map((media) => ({
        surveyId: survey.id,
        roomId: room.id,
        mediaId: media.id,
        kind: media.kind,
        fileName: media.fileName,
      })),
    ),
  );

  const results = survey.rooms.map((room) =>
    buildPlaceholderExtractionResult({
      roomId: room.id,
      roomName: room.name,
      roomNotes: room.notes,
      mediaCount: room.mediaCount,
    }),
  );

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href={`/survey/${survey.id}`} className="text-sm text-slate-300 transition hover:text-white">
            ← Back to survey draft
          </Link>
        </div>
        <ExtractionPreview queue={queue} results={results} />
      </section>
    </main>
  );
}
