import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createShareToken } from "@/lib/share";

export async function POST(
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
  });

  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const shareToken = createShareToken();

  const updated = await prisma.survey.update({
    where: { id: surveyId },
    data: {
      completeness: shareToken,
    },
  });

  return NextResponse.json({ shareToken: updated.completeness });
}
