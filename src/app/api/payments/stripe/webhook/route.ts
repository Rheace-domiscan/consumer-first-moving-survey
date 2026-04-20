import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import {
  applyInvoicePaidCredits,
  markCompanyInvoiceFailed,
  syncCompanySubscriptionFromStripe,
} from "@/lib/company-billing";
import {
  activateEntitlementFromCharge,
  CHARGE_STATUSES,
  getStripeWebhookSecret,
  markChargeStateFromCheckout,
} from "@/lib/payments";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  if (!env.stripeSecretKey) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = getStripeWebhookSecret();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is missing." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = new Stripe(env.stripeSecretKey);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  const existingEvent = await prisma.providerWebhookEvent.findUnique({
    where: {
      providerEventId: event.id,
    },
  });

  if (existingEvent?.status === "PROCESSED") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (existingEvent) {
    await prisma.providerWebhookEvent.update({
      where: {
        id: existingEvent.id,
      },
      data: {
        status: "PROCESSING",
        attempts: existingEvent.attempts + 1,
        lastError: null,
      },
    });
  } else {
    await prisma.providerWebhookEvent.create({
      data: {
        provider: "STRIPE",
        providerEventId: event.id,
        eventType: event.type,
        status: "PROCESSING",
        attempts: 1,
        payloadJson: payload,
      },
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription" && typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncCompanySubscriptionFromStripe(subscription, {
            fallbackCompanyId: session.metadata?.companyId ?? session.client_reference_id ?? null,
            stripeCheckoutSessionId: session.id,
          });
          break;
        }

        const chargeId = session.metadata?.chargeId;

        if (!chargeId) {
          break;
        }

        const result = await activateEntitlementFromCharge({
          chargeId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
        });

        await recordAuditEvent({
          surveyId: result.unlock.surveyId,
          actorType: "system",
          actorId: "stripe_webhook",
          eventType: "mover_payment_captured",
          payload: {
            moverUnlockId: result.unlock.id,
            chargeId,
            stripeCheckoutSessionId: session.id,
          },
        });
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await markChargeStateFromCheckout({
          stripeCheckoutSessionId: session.id,
          status:
            event.type === "checkout.session.expired"
              ? CHARGE_STATUSES.EXPIRED
              : CHARGE_STATUSES.FAILED,
        });

        const charge = await prisma.unlockCharge.findUnique({
          where: {
            stripeCheckoutSessionId: session.id,
          },
          include: {
            moverUnlock: true,
          },
        });

        if (charge) {
          await prisma.moverUnlock.update({
            where: {
              id: charge.moverUnlockId,
            },
            data: {
              status: "PAYMENT_FAILED",
            },
          });

          await recordAuditEvent({
            surveyId: charge.surveyId,
            actorType: "system",
            actorId: "stripe_webhook",
            eventType:
              event.type === "checkout.session.expired"
                ? "mover_checkout_expired"
                : "mover_payment_failed",
            payload: {
              moverUnlockId: charge.moverUnlockId,
              chargeId: charge.id,
              stripeCheckoutSessionId: session.id,
            },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncCompanySubscriptionFromStripe(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncCompanySubscriptionFromStripe(subscription);
          await applyInvoicePaidCredits({
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: subscriptionId,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);

        if (subscriptionId) {
          await markCompanyInvoiceFailed({
            stripeSubscriptionId: subscriptionId,
            stripeInvoiceId: invoice.id,
            invoiceStatus: invoice.status,
          });
        }
        break;
      }

      default:
        break;
    }

    await prisma.providerWebhookEvent.update({
      where: {
        providerEventId: event.id,
      },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
        lastError: null,
      },
    });
  } catch (error) {
    await prisma.providerWebhookEvent.update({
      where: {
        providerEventId: event.id,
      },
      data: {
        status: "FAILED",
        lastError: error instanceof Error ? error.message : "Webhook processing failed.",
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | null }).subscription;

  if (typeof legacy === "string") {
    return legacy;
  }

  const modern = (
    invoice as Stripe.Invoice & {
      parent?: {
        subscription_details?: {
          subscription?: string | null;
        } | null;
      } | null;
    }
  ).parent?.subscription_details?.subscription;

  return typeof modern === "string" ? modern : null;
}
