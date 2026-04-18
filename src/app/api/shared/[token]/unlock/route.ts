import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = (await request.json().catch(() => ({}))) as { moverEmail?: string };

  const survey = await prisma.survey.findFirst({
    where: {
      shareToken: token,
    },
    include: {
      moverUnlocks: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!survey) {
    return NextResponse.json({ error: "Shared survey not found." }, { status: 404 });
  }

  const unlock =
    survey.moverUnlocks.find((item) =>
      body.moverEmail ? item.moverEmail === body.moverEmail : true,
    ) || survey.moverUnlocks[0];

  if (!unlock) {
    return NextResponse.json({ error: "No mover unlock record exists." }, { status: 400 });
  }

  const updated = await prisma.moverUnlock.update({
    where: { id: unlock.id },
    data: {
      status: "UNLOCKED",
      unlockedAt: new Date(),
    },
  });

  await recordAuditEvent({
    surveyId: survey.id,
    actorType: "mover",
    actorId: updated.moverEmail,
    eventType: "mover_unlock_confirmed",
    payload: { moverUnlockId: updated.id },
  });

  return NextResponse.json(updated);
}
