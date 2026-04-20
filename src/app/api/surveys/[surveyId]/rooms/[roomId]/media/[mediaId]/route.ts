import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveSurveyStatus } from "@/lib/survey-status";
import { deriveReadinessState } from "@/lib/readiness";
import { recordAuditEvent } from "@/lib/audit";
import { deleteFromObjectStorage } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ surveyId: string; roomId: string; mediaId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { surveyId, roomId, mediaId } = await params;

  const media = await prisma.surveyMedia.findFirst({
    where: {
      id: mediaId,
      surveyRoomId: roomId,
      surveyRoom: {
        surveyId,
        survey: {
          ownerClerkUserId: userId,
        },
      },
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }

  await deleteFromObjectStorage(media.storageKey);

  await prisma.surveyMedia.delete({
    where: { id: media.id },
  });

  const remainingCount = await prisma.surveyMedia.count({
    where: {
      surveyRoomId: roomId,
    },
  });

  await prisma.surveyRoom.update({
    where: { id: roomId },
    data: {
      mediaCount: remainingCount,
      status: remainingCount > 0 ? "MEDIA_ATTACHED" : "AWAITING_CAPTURE",
    },
  });

  const rooms = await prisma.surveyRoom.findMany({
    where: {
      surveyId,
    },
    select: {
      status: true,
      mediaCount: true,
    },
  });

  await prisma.survey.update({
    where: { id: surveyId },
    data: {
      status: deriveSurveyStatus(rooms),
      readinessState: deriveReadinessState(rooms),
    },
  });

  await recordAuditEvent({
    surveyId,
    actorType: "owner",
    actorId: userId,
    eventType: "media_deleted",
    payload: { roomId, mediaId },
  });

  return NextResponse.json({ ok: true });
}
