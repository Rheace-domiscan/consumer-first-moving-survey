import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { SharedPreview } from "@/components/survey/shared-preview";

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
      </section>
    </main>
  );
}
