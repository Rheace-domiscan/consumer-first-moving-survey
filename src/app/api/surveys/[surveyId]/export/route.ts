import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExportDocument } from "@/lib/export";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  return NextResponse.json(buildExportDocument(survey));
}
