import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { UNLOCK_STATUSES } from "@/lib/payments";

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
    const viewedAt = new Date();
    let updatedCount = 0;

    if (latestUnlock.status === UNLOCK_STATUSES.INVITED) {
      const invitedUpdate = await prisma.moverUnlock.updateMany({
        where: {
          id: latestUnlock.id,
          viewedAt: null,
          status: UNLOCK_STATUSES.INVITED,
        },
        data: {
          status: UNLOCK_STATUSES.VIEWED,
          viewedAt,
        },
      });

      updatedCount = invitedUpdate.count;
    }

    if (!updatedCount) {
      const viewedUpdate = await prisma.moverUnlock.updateMany({
        where: {
          id: latestUnlock.id,
          viewedAt: null,
        },
        data: {
          viewedAt,
        },
      });

      updatedCount = viewedUpdate.count;
    }

    if (updatedCount > 0) {
      await recordAuditEvent({
        surveyId: survey.id,
        actorType: "mover",
        actorId: latestUnlock.moverEmail,
        eventType: "mover_preview_viewed",
        payload: { moverUnlockId: latestUnlock.id },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
