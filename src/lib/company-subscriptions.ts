import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { hasStripePaymentsConfigured, PAYMENT_PROVIDERS } from "@/lib/payments";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  TEAM_PLAN_KEY,
  ensureStripeCustomerForCompany,
  getBillingReturnUrl,
  getStripeClient,
  getSubscriptionPeriodEnd,
  getSubscriptionPeriodStart,
  resolveCompanyIdForSubscription,
} from "@/lib/company-billing-core";

export async function createCompanySubscriptionCheckout(input: {
  companyId: string;
}) {
  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    include: {
      subscriptions: {
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

  if (!hasStripePaymentsConfigured() || !env.stripeCompanyTeamPriceId) {
    return activateMockCompanyPlan(company.id);
  }

  const activeSubscription = company.subscriptions.find((subscription) =>
    ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status),
  );

  if (activeSubscription) {
    return {
      mode: "already_active" as const,
      checkoutUrl: null,
      subscriptionId: activeSubscription.id,
    };
  }

  const customerId = await ensureStripeCustomerForCompany(company);
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: company.id,
    customer: customerId,
    success_url: getBillingReturnUrl("success"),
    cancel_url: getBillingReturnUrl("cancelled"),
    metadata: {
      companyId: company.id,
      planKey: TEAM_PLAN_KEY,
      includedUnlockCredits: String(env.companyTeamPlanIncludedUnlocks),
    },
    subscription_data: {
      metadata: {
        companyId: company.id,
        planKey: TEAM_PLAN_KEY,
        includedUnlockCredits: String(env.companyTeamPlanIncludedUnlocks),
      },
    },
    line_items: [
      {
        price: env.stripeCompanyTeamPriceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
  });

  const pending = await prisma.billingSubscription.create({
    data: {
      companyId: company.id,
      provider: PAYMENT_PROVIDERS.STRIPE,
      planKey: TEAM_PLAN_KEY,
      status: "CHECKOUT_PENDING",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: customerId,
      stripePriceId: env.stripeCompanyTeamPriceId,
      includedUnlockCredits: env.companyTeamPlanIncludedUnlocks,
      metadataJson: JSON.stringify({
        checkoutUrl: session.url,
      }),
    },
  });

  return {
    mode: "stripe" as const,
    checkoutUrl: session.url,
    subscriptionId: pending.id,
  };
}

export async function createCompanyBillingPortalSession(input: {
  companyId: string;
}) {
  if (!hasStripePaymentsConfigured()) {
    throw new Error("Stripe billing portal is not configured.");
  }

  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
  });

  if (!company) {
    throw new Error("Company not found.");
  }

  const customerId = await ensureStripeCustomerForCompany(company);
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: getBillingReturnUrl("portal"),
  });

  return session;
}

export async function syncCompanySubscriptionFromStripe(
  subscription: Stripe.Subscription,
  options?: {
    fallbackCompanyId?: string | null;
    stripeCheckoutSessionId?: string | null;
  },
) {
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : null;
  const companyId = await resolveCompanyIdForSubscription({
    stripeCustomerId,
    metadataCompanyId: subscription.metadata.companyId ?? null,
    fallbackCompanyId: options?.fallbackCompanyId ?? null,
    stripeCheckoutSessionId: options?.stripeCheckoutSessionId ?? null,
  });

  if (!companyId) {
    return null;
  }

  const company = await prisma.company.findUnique({
    where: {
      id: companyId,
    },
    select: {
      id: true,
    },
  });

  if (!company) {
    return null;
  }

  const planKey = subscription.metadata.planKey || TEAM_PLAN_KEY;
  const includedUnlockCredits = Number(
    subscription.metadata.includedUnlockCredits || env.companyTeamPlanIncludedUnlocks,
  );
  const status = subscription.status.toUpperCase();
  const periodStart = getSubscriptionPeriodStart(subscription);
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  const subscriptionData = {
    companyId,
    provider: PAYMENT_PROVIDERS.STRIPE,
    planKey,
    status,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId,
    stripeCheckoutSessionId: options?.stripeCheckoutSessionId ?? undefined,
    stripePriceId: subscription.items.data[0]?.price.id ?? null,
    stripeProductId:
      typeof subscription.items.data[0]?.price.product === "string"
        ? subscription.items.data[0]?.price.product
        : null,
    currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    includedUnlockCredits,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    metadataJson: JSON.stringify(subscription.metadata),
  };

  const pendingLookup = [];
  if (options?.stripeCheckoutSessionId) {
    pendingLookup.push({
      stripeCheckoutSessionId: options.stripeCheckoutSessionId,
    });
  }
  if (stripeCustomerId) {
    pendingLookup.push({
      stripeCustomerId,
      status: "CHECKOUT_PENDING",
    });
  }

  const pending =
    pendingLookup.length > 0
      ? await prisma.billingSubscription.findFirst({
          where: {
            companyId,
            stripeSubscriptionId: null,
            OR: pendingLookup,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : null;

  const updated = pending
    ? await prisma.billingSubscription.update({
        where: {
          id: pending.id,
        },
        data: subscriptionData,
      })
    : await prisma.billingSubscription.upsert({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        update: subscriptionData,
        create: subscriptionData,
      });

  await prisma.company.update({
    where: {
      id: companyId,
    },
    data: {
      planKey,
      subscriptionStatus: status,
      stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : undefined,
      currentPeriodStartsAt: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEndsAt: periodEnd ? new Date(periodEnd * 1000) : null,
      includedUnlockCredits:
        ACTIVE_SUBSCRIPTION_STATUSES.has(status) ? undefined : 0,
    },
  });

  return updated;
}

export async function applyInvoicePaidCredits(input: {
  stripeInvoiceId: string;
  stripeSubscriptionId: string;
}) {
  const subscription = await prisma.billingSubscription.findUnique({
    where: {
      stripeSubscriptionId: input.stripeSubscriptionId,
    },
  });

  if (!subscription) {
    return null;
  }

  const company = await prisma.company.findUnique({
    where: {
      id: subscription.companyId,
    },
  });

  if (!company) {
    return null;
  }

  const existingLedgerEntry = await prisma.companyCreditLedger.findFirst({
    where: {
      companyId: company.id,
      stripeInvoiceId: input.stripeInvoiceId,
      reason: "SUBSCRIPTION_CREDITS_GRANTED",
    },
  });

  if (existingLedgerEntry) {
    return existingLedgerEntry;
  }

  const newIncludedCredits = subscription.includedUnlockCredits;
  const newBalance = newIncludedCredits + company.bonusUnlockCredits;

  const [, ledgerEntry] = await prisma.$transaction([
    prisma.company.update({
      where: {
        id: company.id,
      },
      data: {
        includedUnlockCredits: newIncludedCredits,
        subscriptionStatus: subscription.status,
        currentPeriodStartsAt: subscription.currentPeriodStart,
        currentPeriodEndsAt: subscription.currentPeriodEnd,
      },
    }),
    prisma.companyCreditLedger.create({
      data: {
        companyId: company.id,
        billingSubscriptionId: subscription.id,
        delta: newIncludedCredits,
        balanceAfter: newBalance,
        reason: "SUBSCRIPTION_CREDITS_GRANTED",
        note: `Granted ${newIncludedCredits} included unlock credits for the current billing period.`,
        stripeInvoiceId: input.stripeInvoiceId,
      },
    }),
  ]);

  return ledgerEntry;
}

export async function markCompanyInvoiceFailed(input: {
  stripeSubscriptionId: string;
  stripeInvoiceId: string;
  invoiceStatus: string | null;
}) {
  const subscription = await prisma.billingSubscription.findUnique({
    where: {
      stripeSubscriptionId: input.stripeSubscriptionId,
    },
  });

  if (!subscription) {
    return null;
  }

  await prisma.billingSubscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      lastInvoiceId: input.stripeInvoiceId,
      lastInvoiceStatus: input.invoiceStatus,
    },
  });

  await prisma.company.update({
    where: {
      id: subscription.companyId,
    },
    data: {
      subscriptionStatus: "PAST_DUE",
    },
  });

  return subscription;
}

async function activateMockCompanyPlan(companyId: string) {
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subscription = await prisma.billingSubscription.create({
    data: {
      companyId,
      provider: PAYMENT_PROVIDERS.MOCK,
      planKey: TEAM_PLAN_KEY,
      status: "ACTIVE",
      currentPeriodStart: startsAt,
      currentPeriodEnd: endsAt,
      includedUnlockCredits: env.companyTeamPlanIncludedUnlocks,
    },
  });

  await prisma.$transaction([
    prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        planKey: TEAM_PLAN_KEY,
        subscriptionStatus: "ACTIVE",
        currentPeriodStartsAt: startsAt,
        currentPeriodEndsAt: endsAt,
        includedUnlockCredits: env.companyTeamPlanIncludedUnlocks,
      },
    }),
    prisma.companyCreditLedger.create({
      data: {
        companyId,
        billingSubscriptionId: subscription.id,
        delta: env.companyTeamPlanIncludedUnlocks,
        balanceAfter: env.companyTeamPlanIncludedUnlocks,
        reason: "SUBSCRIPTION_CREDITS_GRANTED",
        note: "Mock subscription activated locally.",
      },
    }),
  ]);

  return {
    mode: "mock" as const,
    checkoutUrl: null,
    subscriptionId: subscription.id,
  };
}
