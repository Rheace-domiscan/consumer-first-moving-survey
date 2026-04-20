import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { createManualUnlockAccess, revokeEntitlementForUnlock } from "@/lib/payments";

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
    include: {
      accessEntitlement: true,
    },
  });

  if (!unlock) {
    return NextResponse.json({ error: "Mover unlock not found." }, { status: 404 });
  }

  if (body.status === "UNLOCKED") {
    const result = await createManualUnlockAccess({
      surveyId,
      moverUnlockId: unlock.id,
      amountCents: unlock.quotedPriceCents,
      currency: unlock.currency,
    });

    await recordAuditEvent({
      surveyId,
      actorType: "owner",
      actorId: userId,
      eventType: "mover_access_manually_granted",
      payload: { unlockId, entitlementId: result.entitlement.id },
    });

    return NextResponse.json(result.unlock);
  }

  if (body.status === "DECLINED") {
    const updated = await revokeEntitlementForUnlock({
      moverUnlockId: unlock.id,
      reason: "owner_declined",
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
