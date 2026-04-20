import { recordAuditEvent } from "@/lib/audit";
import {
  companyCreditsRemaining,
  consumeCompanyUnlockCredit,
  getPrimaryCompanyMembership,
  hasActiveCompanyEntitlement,
} from "@/lib/company-billing";
import {
  createMockUnlockPayment,
  createStripeUnlockCheckout,
  formatMoney,
  getUnlockQuote,
  hasActiveEntitlement,
  resolvePaymentsMode,
} from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { getSharedSurveyUnlockContext } from "@/lib/surveys/repository";

type SharedUnlockContext = {
  token: string;
  userId: string | null;
  userEmail: string | null;
  requestedMoverEmail?: string | null;
};

type SharedUnlockResult = {
  status: number;
  body:
    | {
        error: string;
      }
    | {
        unlocked: boolean;
        mode:
          | "entitled"
          | "company_entitled"
          | "company_credit"
          | "mock"
          | "stripe";
        amountFormatted: string;
        checkoutUrl?: string;
      };
};

export async function startSharedSurveyUnlock(
  input: SharedUnlockContext,
): Promise<SharedUnlockResult> {
  const membership = input.userId ? await getPrimaryCompanyMembership(input.userId) : null;
  const survey = await getSharedSurveyUnlockContext(input.token);

  if (!survey) {
    return {
      status: 404,
      body: {
        error: "Shared survey not found.",
      },
    };
  }

  let unlock = await findOrCreateUnlock({
    survey,
    userId: input.userId,
    userEmail: input.userEmail,
    requestedMoverEmail: input.requestedMoverEmail ?? null,
    membership,
  });

  if (!unlock) {
    return {
      status: 400,
      body: {
        error: "No mover unlock record exists.",
      },
    };
  }

  if (membership?.companyId && (unlock.companyId !== membership.companyId || unlock.claimedByClerkUserId !== input.userId)) {
    unlock = await prisma.moverUnlock.update({
      where: {
        id: unlock.id,
      },
      data: {
        companyId: membership.companyId,
        companyName: membership.company.name,
        claimedByClerkUserId: input.userId,
      },
      include: {
        accessEntitlement: true,
        unlockCharges: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });
  }

  if (hasActiveEntitlement(unlock.accessEntitlement) || unlock.status === "UNLOCKED") {
    return unlockSuccess("entitled", unlock.quotedPriceCents, unlock.currency);
  }

  if (membership?.companyId) {
    const companyAlreadyUnlocked = await hasActiveCompanyEntitlement({
      companyId: membership.companyId,
      surveyId: survey.id,
    });

    if (companyAlreadyUnlocked) {
      return unlockSuccess("company_entitled", unlock.quotedPriceCents, unlock.currency);
    }

    if (companyCreditsRemaining(membership.company) > 0) {
      await consumeCompanyUnlockCredit({
        companyId: membership.companyId,
        surveyId: survey.id,
        moverUnlockId: unlock.id,
        claimedByClerkUserId: input.userId!,
        coveredAmountCents: unlock.quotedPriceCents,
        currency: unlock.currency,
      });

      return unlockSuccess("company_credit", unlock.quotedPriceCents, unlock.currency);
    }
  }

  const paymentsMode = resolvePaymentsMode();

  if (paymentsMode === "mock") {
    await createMockUnlockPayment({
      surveyId: survey.id,
      moverUnlockId: unlock.id,
      amountCents: unlock.quotedPriceCents,
      currency: unlock.currency,
      companyId: membership?.companyId ?? null,
      claimedByClerkUserId: input.userId ?? null,
    });

    await recordAuditEvent({
      surveyId: survey.id,
      actorType: "mover",
      actorId: input.userId ?? unlock.moverEmail,
      eventType: "mover_unlock_mock_paid",
      payload: {
        moverUnlockId: unlock.id,
        amountFormatted: formatMoney(unlock.quotedPriceCents, unlock.currency),
      },
    });

    return unlockSuccess("mock", unlock.quotedPriceCents, unlock.currency);
  }

  const checkout = await createStripeUnlockCheckout({
    survey: {
      id: survey.id,
      shareToken: survey.shareToken,
      title: survey.title,
    },
    moverUnlock: {
      id: unlock.id,
      moverEmail: unlock.moverEmail,
      companyName: unlock.companyName,
      companyId: unlock.companyId,
      quotedPriceCents: unlock.quotedPriceCents,
      currency: unlock.currency,
    },
  });

  await recordAuditEvent({
    surveyId: survey.id,
    actorType: "mover",
    actorId: input.userId ?? unlock.moverEmail,
    eventType: "mover_checkout_started",
    payload: {
      moverUnlockId: unlock.id,
      chargeId: checkout.chargeId,
      amountFormatted: formatMoney(unlock.quotedPriceCents, unlock.currency),
      companyId: membership?.companyId ?? null,
    },
  });

  return {
    status: 200,
    body: {
      unlocked: false,
      mode: "stripe",
      checkoutUrl: checkout.checkoutUrl ?? undefined,
      amountFormatted: formatMoney(unlock.quotedPriceCents, unlock.currency),
    },
  };
}

async function findOrCreateUnlock(input: {
  survey: Awaited<ReturnType<typeof getSharedSurveyUnlockContext>>;
  userId: string | null;
  userEmail: string | null;
  requestedMoverEmail: string | null;
  membership: Awaited<ReturnType<typeof getPrimaryCompanyMembership>>;
}) {
  const survey = input.survey;

  if (!survey) {
    return null;
  }

  let unlock =
    survey.moverUnlocks.find((item) =>
      input.requestedMoverEmail ? item.moverEmail === input.requestedMoverEmail : false,
    ) ||
    survey.moverUnlocks.find((item) => (input.userEmail ? item.moverEmail === input.userEmail : false)) ||
    survey.moverUnlocks.find((item) =>
      input.membership ? item.companyId === input.membership.companyId : false,
    ) ||
    survey.moverUnlocks[0];

  if (unlock) {
    return unlock;
  }

  if (!input.userEmail && !input.requestedMoverEmail) {
    return null;
  }

  const quote = getUnlockQuote({
    propertyType: survey.propertyType,
    roomsCount: survey.rooms.length,
    roomsWithMedia: survey.rooms.filter((room) => room.mediaCount > 0).length,
  });

  return prisma.moverUnlock.create({
    data: {
      surveyId: survey.id,
      moverEmail: input.requestedMoverEmail || input.userEmail || "mover@example.com",
      companyId: input.membership?.companyId ?? null,
      companyName: input.membership?.company.name ?? null,
      claimedByClerkUserId: input.userId ?? null,
      status: "INVITED",
      quotedPriceCents: quote.amountCents,
      currency: quote.currency,
    },
    include: {
      accessEntitlement: true,
      unlockCharges: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });
}

function unlockSuccess(
  mode: "entitled" | "company_entitled" | "company_credit" | "mock",
  amountCents: number,
  currency: string,
): SharedUnlockResult {
  return {
    status: 200,
    body: {
      unlocked: true,
      mode,
      amountFormatted: formatMoney(amountCents, currency),
    },
  };
}
