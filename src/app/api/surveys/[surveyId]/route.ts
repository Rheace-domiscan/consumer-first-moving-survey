import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateGlobalRetentionPolicy, purgeSurveyData } from "@/lib/retention";

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
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  return NextResponse.json(survey);
}

export async function DELETE(
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
    select: {
      id: true,
    },
  });

  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const policy = await getOrCreateGlobalRetentionPolicy();

  if (!policy.allowOwnerDelete) {
    return NextResponse.json(
      { error: "Owner deletion is disabled by the active retention policy." },
      { status: 403 },
    );
  }

  await purgeSurveyData({
    surveyId,
    triggeredByClerkUserId: userId,
    reason: "owner_delete",
  });

  return NextResponse.json({ ok: true });
}
