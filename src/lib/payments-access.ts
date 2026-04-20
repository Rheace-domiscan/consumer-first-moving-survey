import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CHARGE_STATUSES,
  CHARGE_TYPES,
  ENTITLEMENT_STATUSES,
  PAYMENT_PROVIDERS,
  UNLOCK_STATUSES,
} from "@/lib/payments-core";

type ActivateEntitlementInput = {
  surveyId: string;
  moverUnlockId: string;
  companyId?: string | null;
  billingSubscriptionId?: string | null;
  chargeId?: string;
  provider: string;
  chargeStatus: string;
  chargeType: string;
  amountCents: number;
  currency: string;
  source: string;
  paidAt: Date;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  claimedByClerkUserId?: string | null;
  unlockSource?: string | null;
  chargeMetadata?: Record<string, unknown> | null;
};

export async function createMockUnlockPayment(input: {
  surveyId: string;
  moverUnlockId: string;
  amountCents: number;
  currency: string;
  companyId?: string | null;
  claimedByClerkUserId?: string | null;
}) {
  return prisma.$transaction(async (tx) =>
    activateEntitlementInTransaction(tx, {
      surveyId: input.surveyId,
      moverUnlockId: input.moverUnlockId,
      provider: PAYMENT_PROVIDERS.MOCK,
      chargeStatus: CHARGE_STATUSES.PAID,
      chargeType: CHARGE_TYPES.UNLOCK,
      amountCents: input.amountCents,
      currency: input.currency,
      source: "MOCK_PAYMENT",
      paidAt: new Date(),
      companyId: input.companyId ?? null,
      claimedByClerkUserId: input.claimedByClerkUserId ?? null,
      unlockSource: input.companyId ? "COMPANY_MOCK_PAYMENT" : "MOCK_PAYMENT",
    }),
  );
}

export async function createManualUnlockAccess(input: {
  surveyId: string;
  moverUnlockId: string;
  amountCents: number;
  currency: string;
  companyId?: string | null;
  claimedByClerkUserId?: string | null;
}) {
  return prisma.$transaction(async (tx) =>
    activateEntitlementInTransaction(tx, {
      surveyId: input.surveyId,
      moverUnlockId: input.moverUnlockId,
      provider: PAYMENT_PROVIDERS.MANUAL,
      chargeStatus: CHARGE_STATUSES.PAID,
      chargeType: CHARGE_TYPES.UNLOCK,
      amountCents: input.amountCents,
      currency: input.currency,
      source: "MANUAL_OVERRIDE",
      paidAt: new Date(),
      companyId: input.companyId ?? null,
      claimedByClerkUserId: input.claimedByClerkUserId ?? null,
      unlockSource: input.companyId ? "COMPANY_MANUAL_OVERRIDE" : "MANUAL_OVERRIDE",
    }),
  );
}

export async function createCompanyCreditUnlockAccess(input: {
  surveyId: string;
  moverUnlockId: string;
  companyId: string;
  billingSubscriptionId?: string | null;
  coveredAmountCents: number;
  currency: string;
  claimedByClerkUserId: string;
}) {
  return prisma.$transaction(async (tx) =>
    activateEntitlementInTransaction(tx, {
      surveyId: input.surveyId,
      moverUnlockId: input.moverUnlockId,
      provider: PAYMENT_PROVIDERS.COMPANY_CREDIT,
      chargeStatus: CHARGE_STATUSES.PAID,
      chargeType: CHARGE_TYPES.COMPANY_CREDIT,
      amountCents: 0,
      currency: input.currency,
      source: "COMPANY_CREDIT",
      paidAt: new Date(),
      companyId: input.companyId,
      billingSubscriptionId: input.billingSubscriptionId ?? null,
      claimedByClerkUserId: input.claimedByClerkUserId,
      unlockSource: "COMPANY_CREDIT",
      chargeMetadata: {
        coveredAmountCents: input.coveredAmountCents,
      },
    }),
  );
}

export async function grantUnlockAccessInTransaction(
  tx: Prisma.TransactionClient,
  input: ActivateEntitlementInput,
) {
  return activateEntitlementInTransaction(tx, input);
}

export async function activateEntitlementFromCharge(input: {
  chargeId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  source?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const charge = await tx.unlockCharge.findUnique({
      where: {
        id: input.chargeId,
      },
    });

    if (!charge) {
      throw new Error("Unlock charge not found.");
    }

    return activateEntitlementInTransaction(tx, {
      surveyId: charge.surveyId,
      moverUnlockId: charge.moverUnlockId,
      companyId: charge.companyId,
      billingSubscriptionId: charge.billingSubscriptionId,
      chargeId: charge.id,
      provider: charge.provider,
      chargeStatus: CHARGE_STATUSES.PAID,
      chargeType: charge.chargeType,
      amountCents: charge.amountCents,
      currency: charge.currency,
      source: input.source ?? "PAYMENT",
      paidAt: new Date(),
      stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? charge.stripeCheckoutSessionId,
      stripePaymentIntentId: input.stripePaymentIntentId ?? charge.stripePaymentIntentId,
      stripeCustomerId: input.stripeCustomerId ?? charge.stripeCustomerId,
      unlockSource: charge.companyId ? "COMPANY_STRIPE_CHECKOUT" : "STRIPE_CHECKOUT",
    });
  });
}

export async function markChargeStateFromCheckout(input: {
  stripeCheckoutSessionId: string;
  status: string;
}) {
  return prisma.unlockCharge.updateMany({
    where: {
      stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    },
    data: {
      status: input.status,
    },
  });
}

export async function revokeEntitlementForUnlock(input: {
  moverUnlockId: string;
  reason: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.accessEntitlement.updateMany({
      where: {
        moverUnlockId: input.moverUnlockId,
        status: ENTITLEMENT_STATUSES.ACTIVE,
      },
      data: {
        status: ENTITLEMENT_STATUSES.REVOKED,
        revokedAt: new Date(),
        revokedReason: input.reason,
      },
    });

    return tx.moverUnlock.update({
      where: {
        id: input.moverUnlockId,
      },
      data: {
        status: UNLOCK_STATUSES.DECLINED,
      },
    });
  });
}

async function activateEntitlementInTransaction(
  tx: Prisma.TransactionClient,
  input: ActivateEntitlementInput,
) {
  const charge =
    input.chargeId
      ? await tx.unlockCharge.update({
          where: {
            id: input.chargeId,
          },
          data: {
            companyId: input.companyId ?? undefined,
            billingSubscriptionId: input.billingSubscriptionId ?? undefined,
            status: input.chargeStatus,
            chargeType: input.chargeType,
            paidAt: input.paidAt,
            stripeCheckoutSessionId: input.stripeCheckoutSessionId,
            stripePaymentIntentId: input.stripePaymentIntentId,
            stripeCustomerId: input.stripeCustomerId,
            metadataJson: input.chargeMetadata ? JSON.stringify(input.chargeMetadata) : undefined,
          },
        })
      : await tx.unlockCharge.create({
          data: {
            surveyId: input.surveyId,
            moverUnlockId: input.moverUnlockId,
            companyId: input.companyId,
            billingSubscriptionId: input.billingSubscriptionId,
            provider: input.provider,
            status: input.chargeStatus,
            chargeType: input.chargeType,
            amountCents: input.amountCents,
            currency: input.currency,
            paidAt: input.paidAt,
            stripeCheckoutSessionId: input.stripeCheckoutSessionId,
            stripePaymentIntentId: input.stripePaymentIntentId,
            stripeCustomerId: input.stripeCustomerId,
            metadataJson: input.chargeMetadata ? JSON.stringify(input.chargeMetadata) : null,
          },
        });

  const unlock = await tx.moverUnlock.update({
    where: {
      id: input.moverUnlockId,
    },
    data: {
      companyId: input.companyId ?? undefined,
      status: UNLOCK_STATUSES.UNLOCKED,
      paymentCapturedAt: input.paidAt,
      unlockedAt: input.paidAt,
      stripeCustomerId: input.stripeCustomerId,
      claimedByClerkUserId: input.claimedByClerkUserId ?? undefined,
      unlockSource: input.unlockSource ?? undefined,
    },
  });

  const entitlement = await tx.accessEntitlement.upsert({
    where: {
      moverUnlockId: input.moverUnlockId,
    },
    update: {
      unlockChargeId: charge.id,
      companyId: input.companyId ?? undefined,
      status: ENTITLEMENT_STATUSES.ACTIVE,
      source: input.source,
      scope: input.companyId ? "COMPANY" : "MOVER_UNLOCK",
      grantedAt: input.paidAt,
      revokedAt: null,
      revokedReason: null,
      expiresAt: null,
    },
    create: {
      surveyId: input.surveyId,
      moverUnlockId: input.moverUnlockId,
      unlockChargeId: charge.id,
      companyId: input.companyId,
      source: input.source,
      scope: input.companyId ? "COMPANY" : "MOVER_UNLOCK",
      status: ENTITLEMENT_STATUSES.ACTIVE,
      grantedAt: input.paidAt,
    },
  });

  return { charge, unlock, entitlement };
}
