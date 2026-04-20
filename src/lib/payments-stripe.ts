import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  CHARGE_STATUSES,
  CHARGE_TYPES,
  PAYMENT_PROVIDERS,
  UNLOCK_STATUSES,
  hasStripePaymentsConfigured,
  getStripeWebhookSecret,
} from "@/lib/payments-core";

export async function createStripeUnlockCheckout(input: {
  survey: {
    id: string;
    shareToken: string | null;
    title: string | null;
  };
  moverUnlock: {
    id: string;
    moverEmail: string;
    companyName: string | null;
    companyId?: string | null;
    quotedPriceCents: number;
    currency: string;
  };
}) {
  if (!hasStripePaymentsConfigured()) {
    throw new Error("Stripe payments are not configured.");
  }

  if (!input.survey.shareToken) {
    throw new Error("Share link is required before checkout can be created.");
  }

  const existingCharge = await prisma.unlockCharge.findFirst({
    where: {
      moverUnlockId: input.moverUnlock.id,
      provider: PAYMENT_PROVIDERS.STRIPE,
      status: CHARGE_STATUSES.CHECKOUT_CREATED,
      checkoutUrl: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingCharge?.checkoutUrl) {
    return {
      checkoutUrl: existingCharge.checkoutUrl,
      chargeId: existingCharge.id,
    };
  }

  const charge = await prisma.unlockCharge.create({
    data: {
      surveyId: input.survey.id,
      moverUnlockId: input.moverUnlock.id,
      companyId: input.moverUnlock.companyId ?? null,
      provider: PAYMENT_PROVIDERS.STRIPE,
      chargeType: CHARGE_TYPES.UNLOCK,
      status: CHARGE_STATUSES.PENDING,
      amountCents: input.moverUnlock.quotedPriceCents,
      currency: input.moverUnlock.currency,
    },
  });

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${env.appBaseUrl}/shared/${input.survey.shareToken}?checkout=success`,
    cancel_url: `${env.appBaseUrl}/shared/${input.survey.shareToken}?checkout=cancelled`,
    customer_email: input.moverUnlock.moverEmail,
    client_reference_id: input.moverUnlock.id,
    metadata: {
      chargeId: charge.id,
      surveyId: input.survey.id,
      moverUnlockId: input.moverUnlock.id,
      ...(input.moverUnlock.companyId ? { companyId: input.moverUnlock.companyId } : {}),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.moverUnlock.currency,
          unit_amount: input.moverUnlock.quotedPriceCents,
          product_data: {
            name: "Mover survey unlock",
            description: input.survey.title
              ? `${input.survey.title} unlock`
              : "Consumer-first moving survey unlock",
          },
        },
      },
    ],
  });

  await prisma.moverUnlock.update({
    where: {
      id: input.moverUnlock.id,
    },
    data: {
      status: UNLOCK_STATUSES.CHECKOUT_PENDING,
      checkoutStartedAt: new Date(),
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : null,
    },
  });

  await prisma.unlockCharge.update({
    where: {
      id: charge.id,
    },
    data: {
      status: CHARGE_STATUSES.CHECKOUT_CREATED,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : null,
      checkoutUrl: session.url ?? null,
      metadataJson: JSON.stringify({
        checkoutUrl: session.url,
      }),
    },
  });

  return {
    checkoutUrl: session.url,
    chargeId: charge.id,
  };
}

export { getStripeWebhookSecret };

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new Error("Stripe secret key is missing.");
  }

  return new Stripe(env.stripeSecretKey);
}
