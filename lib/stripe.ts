/**
 * Stripe integration for The Local Yield.
 * Checkout with local pickup option; no shipping.
 */

import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" })
  : null;

export function isStripeConfigured(): boolean {
  return Boolean(stripeSecretKey);
}

/** Create a Checkout session for one-time purchase (local pickup). */
export async function createCheckoutSession(params: {
  lineItems: Array<{ priceIdOrPrice: string; quantity: number }>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) return null;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: params.lineItems.map((item) => ({
      price: item.priceIdOrPrice,
      quantity: item.quantity,
    })),
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata: params.metadata ?? {},
    // No shipping — local pickup only
    shipping_address_collection: undefined,
  });
  return session;
}

/** Verify webhook signature (use in API route). */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe || !stripeWebhookSecret) return null;
  try {
    return stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret) as Stripe.Event;
  } catch {
    return null;
  }
}
