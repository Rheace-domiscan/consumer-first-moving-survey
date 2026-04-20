import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { formatMoney, getUnlockQuote } from "@/lib/payments";
import { resolveCompanyForInvite } from "@/lib/company-billing";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { surveyId } = await params;
  const body = (await request.json()) as { moverEmail?: string; companyName?: string };

  if (!body.moverEmail?.trim()) {
    return NextResponse.json({ error: "Mover email is required." }, { status: 400 });
  }

  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      ownerClerkUserId: userId,
    },
    include: {
      rooms: {
        select: {
          id: true,
          mediaCount: true,
        },
      },
    },
  });

  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const quote = getUnlockQuote({
    propertyType: survey.propertyType,
    roomsCount: survey.rooms.length,
    roomsWithMedia: survey.rooms.filter((room) => room.mediaCount > 0).length,
  });
  const company = await resolveCompanyForInvite({
    moverEmail: body.moverEmail.trim(),
    companyName: body.companyName?.trim() || null,
  });

  const unlock = await prisma.moverUnlock.create({
    data: {
      surveyId,
      moverEmail: body.moverEmail.trim(),
      companyId: company?.id ?? null,
      companyName: company?.name ?? (body.companyName?.trim() || null),
      status: "INVITED",
      quotedPriceCents: quote.amountCents,
      currency: quote.currency,
    },
  });

  await recordAuditEvent({
    surveyId,
    actorType: "owner",
    actorId: userId,
    eventType: "mover_invited",
    payload: {
      moverEmail: unlock.moverEmail,
      companyName: unlock.companyName,
      quotedPrice: formatMoney(unlock.quotedPriceCents, unlock.currency),
    },
  });

  return NextResponse.json(unlock, { status: 201 });
}
