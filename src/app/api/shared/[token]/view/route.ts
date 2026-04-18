import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const survey = await prisma.survey.findFirst({
    where: {
      shareToken: token,
    },
    include: {
      moverUnlocks: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!survey) {
    return NextResponse.json({ error: "Shared survey not found." }, { status: 404 });
  }

  const latestUnlock = survey.moverUnlocks[0];

  if (latestUnlock && !latestUnlock.viewedAt) {
    await prisma.moverUnlock.update({
      where: { id: latestUnlock.id },
      data: {
        status: "VIEWED",
        viewedAt: new Date(),
      },
    });

    await recordAuditEvent({
      surveyId: survey.id,
      actorType: "mover",
      actorId: latestUnlock.moverEmail,
      eventType: "mover_preview_viewed",
      payload: { moverUnlockId: latestUnlock.id },
    });
  }

  return NextResponse.json({ ok: true });
}
