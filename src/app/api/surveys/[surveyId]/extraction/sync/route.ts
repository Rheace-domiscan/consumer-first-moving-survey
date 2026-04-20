import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncExtractionArtifactsForSurvey } from "@/lib/extraction-persistence";
import { recordAuditEvent } from "@/lib/audit";

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

  const result = await syncExtractionArtifactsForSurvey(surveyId);

  await recordAuditEvent({
    surveyId,
    actorType: "owner",
    actorId: userId,
    eventType: "extraction_sync_requested",
    payload: {
      jobCount: Array.isArray(result) ? result.length : 0,
    },
  });

  return NextResponse.json(result);
}
