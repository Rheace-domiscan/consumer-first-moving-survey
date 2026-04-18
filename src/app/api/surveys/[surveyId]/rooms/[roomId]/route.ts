import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json(updated);
}
