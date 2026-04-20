import { recordAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  CHARGE_STATUSES,
  CHARGE_TYPES,
  ENTITLEMENT_STATUSES,
  PAYMENT_PROVIDERS,
  grantUnlockAccessInTransaction,
} from "@/lib/payments";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/company-billing-core";

export async function hasActiveCompanyEntitlement(input: {
  companyId: string;
  surveyId: string;
}) {
  const entitlement = await prisma.accessEntitlement.findFirst({
    where: {
      companyId: input.companyId,
      surveyId: input.surveyId,
      status: ENTITLEMENT_STATUSES.ACTIVE,
      revokedAt: null,
    },
  });

  return Boolean(entitlement);
}

export async function consumeCompanyUnlockCredit(input: {
  companyId: string;
  surveyId: string;
  moverUnlockId: string;
  claimedByClerkUserId: string;
  coveredAmountCents: number;
  currency: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.findUnique({
      where: {
        id: input.companyId,
      },
      include: {
        subscriptions: {
          where: {
            status: {
              in: Array.from(ACTIVE_SUBSCRIPTION_STATUSES),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!company) {
      throw new Error("Company not found.");
    }

    const totalCredits = companyCreditsRemaining(company);
    if (totalCredits <= 0) {
      throw new Error("No company unlock credits remain.");
    }

    const useIncluded = company.includedUnlockCredits > 0;
    const nextIncluded = useIncluded ? company.includedUnlockCredits - 1 : company.includedUnlockCredits;
    const nextBonus = useIncluded ? company.bonusUnlockCredits : company.bonusUnlockCredits - 1;
    const nextBalance = nextIncluded + nextBonus;
    const activeSubscription = company.subscriptions[0] ?? null;

    await tx.company.update({
      where: {
        id: company.id,
      },
      data: {
        includedUnlockCredits: nextIncluded,
        bonusUnlockCredits: nextBonus,
      },
    });

    await tx.companyCreditLedger.create({
      data: {
        companyId: company.id,
        billingSubscriptionId: activeSubscription?.id ?? null,
        surveyId: input.surveyId,
        moverUnlockId: input.moverUnlockId,
        delta: -1,
        balanceAfter: nextBalance,
        reason: "UNLOCK_CONSUMED",
        note: useIncluded ? "Consumed an included monthly unlock credit." : "Consumed a bonus unlock credit.",
      },
    });

    const access = await grantUnlockAccessInTransaction(tx, {
      surveyId: input.surveyId,
      moverUnlockId: input.moverUnlockId,
      companyId: company.id,
      billingSubscriptionId: activeSubscription?.id ?? null,
      provider: PAYMENT_PROVIDERS.COMPANY_CREDIT,
      chargeStatus: CHARGE_STATUSES.PAID,
      chargeType: CHARGE_TYPES.COMPANY_CREDIT,
      amountCents: 0,
      currency: input.currency,
      source: "COMPANY_CREDIT",
      paidAt: new Date(),
      claimedByClerkUserId: input.claimedByClerkUserId,
      unlockSource: "COMPANY_CREDIT",
      chargeMetadata: {
        coveredAmountCents: input.coveredAmountCents,
      },
    });

    return {
      companyId: company.id,
      subscriptionId: activeSubscription?.id ?? null,
      access,
      creditsRemaining: nextBalance,
    };
  });

  await recordAuditEvent({
    surveyId: input.surveyId,
    actorType: "system",
    actorId: input.claimedByClerkUserId,
    eventType: "company_credit_unlock_consumed",
    payload: {
      companyId: result.companyId,
      moverUnlockId: input.moverUnlockId,
      creditsRemaining: result.creditsRemaining,
    },
  });

  return result;
}

export function companyCreditsRemaining(company: {
  includedUnlockCredits: number;
  bonusUnlockCredits: number;
}) {
  return company.includedUnlockCredits + company.bonusUnlockCredits;
}

export function isCompanySubscriptionActive(company: {
  subscriptionStatus: string | null;
  currentPeriodEndsAt: Date | string | null;
}) {
  const status = company.subscriptionStatus?.toUpperCase() ?? null;

  if (!status || !ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    return false;
  }

  if (company.currentPeriodEndsAt && new Date(company.currentPeriodEndsAt) <= new Date()) {
    return false;
  }

  return true;
}
