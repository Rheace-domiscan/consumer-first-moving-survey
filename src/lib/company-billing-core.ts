import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["ACTIVE", "TRIALING"]);
export const TEAM_PLAN_KEY = "TEAM_MONTHLY";

export function getBillingReturnUrl(state: "success" | "cancelled" | "portal") {
  return `${env.appBaseUrl}/billing-return?state=${state}`;
}

export async function ensureStripeCustomerForCompany(company: {
  id: string;
  name: string;
  billingEmail: string;
  stripeCustomerId: string | null;
}) {
  if (company.stripeCustomerId) {
    return company.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: company.billingEmail,
    name: company.name,
    metadata: {
      companyId: company.id,
    },
  });

  await prisma.company.update({
    where: {
      id: company.id,
    },
    data: {
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

export function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("Stripe secret key is missing.");
  }

  return new Stripe(env.stripeSecretKey);
}

export async function resolveCompanyIdForSubscription(input: {
  stripeCustomerId: string | null;
  metadataCompanyId: string | null;
  fallbackCompanyId: string | null;
  stripeCheckoutSessionId: string | null;
}) {
  if (input.metadataCompanyId) {
    return input.metadataCompanyId;
  }

  if (input.fallbackCompanyId) {
    return input.fallbackCompanyId;
  }

  if (input.stripeCheckoutSessionId) {
    const pending = await prisma.billingSubscription.findFirst({
      where: {
        stripeCheckoutSessionId: input.stripeCheckoutSessionId,
      },
      select: {
        companyId: true,
      },
    });

    if (pending?.companyId) {
      return pending.companyId;
    }
  }

  if (input.stripeCustomerId) {
    const company = await prisma.company.findUnique({
      where: {
        stripeCustomerId: input.stripeCustomerId,
      },
      select: {
        id: true,
      },
    });

    if (company?.id) {
      return company.id;
    }

    const pending = await prisma.billingSubscription.findFirst({
      where: {
        stripeCustomerId: input.stripeCustomerId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        companyId: true,
      },
    });

    if (pending?.companyId) {
      return pending.companyId;
    }
  }

  return null;
}

export async function ensureUniqueSlug(name: string) {
  const base = slugify(name);
  let candidate = base;
  let index = 2;

  while (await prisma.company.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function getSubscriptionPeriodStart(subscription: Stripe.Subscription) {
  const root = (subscription as Stripe.Subscription & { current_period_start?: number | null })
    .current_period_start;

  if (typeof root === "number") {
    return root;
  }

  const itemPeriod = (
    subscription as Stripe.Subscription & {
      items?: {
        data?: Array<{
          current_period_start?: number | null;
        }>;
      };
    }
  ).items?.data?.[0]?.current_period_start;

  return typeof itemPeriod === "number" ? itemPeriod : null;
}

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const root = (subscription as Stripe.Subscription & { current_period_end?: number | null })
    .current_period_end;

  if (typeof root === "number") {
    return root;
  }

  const itemPeriod = (
    subscription as Stripe.Subscription & {
      items?: {
        data?: Array<{
          current_period_end?: number | null;
        }>;
      };
    }
  ).items?.data?.[0]?.current_period_end;

  return typeof itemPeriod === "number" ? itemPeriod : null;
}
