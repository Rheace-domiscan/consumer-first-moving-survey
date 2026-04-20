import { env } from "@/lib/env";

export const PAYMENT_PROVIDERS = {
  MOCK: "MOCK",
  STRIPE: "STRIPE",
  MANUAL: "MANUAL",
  COMPANY_CREDIT: "COMPANY_CREDIT",
} as const;

export const UNLOCK_STATUSES = {
  INVITED: "INVITED",
  VIEWED: "VIEWED",
  CHECKOUT_PENDING: "CHECKOUT_PENDING",
  UNLOCKED: "UNLOCKED",
  DECLINED: "DECLINED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
} as const;

export const CHARGE_STATUSES = {
  PENDING: "PENDING",
  CHECKOUT_CREATED: "CHECKOUT_CREATED",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELED: "CANCELED",
  EXPIRED: "EXPIRED",
} as const;

export const CHARGE_TYPES = {
  UNLOCK: "UNLOCK",
  COMPANY_CREDIT: "COMPANY_CREDIT",
  SUBSCRIPTION: "SUBSCRIPTION",
} as const;

export const ENTITLEMENT_STATUSES = {
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
} as const;

export type PaymentsMode = "mock" | "stripe";

export type UnlockQuote = {
  amountCents: number;
  currency: string;
  tier: "standard" | "premium";
  label: string;
};

export function resolvePaymentsMode(): PaymentsMode {
  if (env.paymentsProvider === "stripe") {
    return "stripe";
  }

  if (env.paymentsProvider === "mock") {
    return "mock";
  }

  return env.stripeSecretKey ? "stripe" : "mock";
}

export function hasStripePaymentsConfigured() {
  return resolvePaymentsMode() === "stripe" && Boolean(env.stripeSecretKey && env.appBaseUrl);
}

export function getUnlockQuote(input: {
  propertyType: string | null;
  roomsCount: number;
  roomsWithMedia: number;
}): UnlockQuote {
  const premium =
    input.roomsCount >= 5 ||
    input.roomsWithMedia >= 4 ||
    /(house|detached|semi|townhouse)/i.test(input.propertyType ?? "");

  return {
    amountCents: premium ? env.unlockPricePremiumCents : env.unlockPriceStandardCents,
    currency: env.paymentsCurrency.toLowerCase(),
    tier: premium ? "premium" : "standard",
    label: premium ? "Premium full-home survey unlock" : "Standard survey unlock",
  };
}

export function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

export function hasActiveEntitlement(entitlement?: {
  status: string;
  expiresAt: Date | string | null;
  revokedAt: Date | string | null;
} | null) {
  if (!entitlement) {
    return false;
  }

  if (entitlement.status !== ENTITLEMENT_STATUSES.ACTIVE || entitlement.revokedAt) {
    return false;
  }

  if (entitlement.expiresAt && new Date(entitlement.expiresAt) <= new Date()) {
    return false;
  }

  return true;
}

export function getStripeWebhookSecret() {
  return env.stripeWebhookSecret;
}
