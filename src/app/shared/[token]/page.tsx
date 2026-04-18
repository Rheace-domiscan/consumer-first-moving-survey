import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { SharedPreview } from "@/components/survey/shared-preview";
import { SharedPreviewActions } from "@/components/survey/shared-preview-actions";

export default async function SharedSurveyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const survey = await prisma.survey.findFirst({
    where: {
      shareToken: token,
    },
    include: {
      rooms: {
        orderBy: {
          createdAt: "asc",
        },
      },
      moverUnlocks: {
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
        <SharedPreview survey={survey} />
        <div className="mt-6">
          <SharedPreviewActions token={token} moverEmailHint={survey.moverUnlocks[0]?.moverEmail ?? null} />
        </div>
      </section>
    </main>
  );
}
