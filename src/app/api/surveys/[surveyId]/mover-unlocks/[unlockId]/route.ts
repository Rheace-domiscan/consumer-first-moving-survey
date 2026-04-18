import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ surveyId: string; unlockId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { surveyId, unlockId } = await params;
  const body = (await request.json()) as { status?: string };

  const unlock = await prisma.moverUnlock.findFirst({
    where: {
      id: unlockId,
      surveyId,
      survey: {
        ownerClerkUserId: userId,
      },
    },
  });

  if (!unlock) {
    return NextResponse.json({ error: "Mover unlock not found." }, { status: 404 });
  }

  const updated = await prisma.moverUnlock.update({
    where: { id: unlock.id },
    data: {
      status: body.status || unlock.status,
    },
  });

  await recordAuditEvent({
    surveyId,
    actorType: "owner",
    actorId: userId,
    eventType: "mover_unlock_status_updated",
    payload: { unlockId, status: updated.status },
  });

  return NextResponse.json(updated);
}
