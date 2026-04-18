import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveSurveyStatus } from "@/lib/survey-status";
import { deriveReadinessState } from "@/lib/readiness";
import { recordAuditEvent } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ surveyId: string; roomId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { surveyId, roomId } = await params;
  const body = (await request.json()) as { status?: string; notes?: string };

  const room = await prisma.surveyRoom.findFirst({
    where: {
      id: roomId,
      surveyId,
      survey: {
        ownerClerkUserId: userId,
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const updated = await prisma.surveyRoom.update({
    where: { id: room.id },
    data: {
      status: body.status ?? room.status,
      notes: body.notes ?? room.notes,
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
    eventType: "room_updated",
    payload: { roomId, status: updated.status, notes: updated.notes },
  });

  return NextResponse.json(updated);
}
