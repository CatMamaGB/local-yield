/**
 * Stripe integration for The Local Yield.
 * Phase 1: Stub only — no keys, no checkout. Add when you’re ready for card payments & payouts.
 */

/** True when STRIPE_SECRET_KEY is set. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export interface CheckoutMetadata {
  /** market | care — for routing and future payout logic */
  context?: string;
  /** Order or CareBooking id for fulfillment */
  orderId?: string;
  /** For future: split payout type, escrow flag, etc. */
  [key: string]: string | undefined;
}

/**
 * Create a Checkout session (local pickup, no shipping).
 * metadata.context: "market" | "care"; metadata.orderId for linking.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub param for future impl
export async function createCheckoutSession(_params: {
  lineItems: Array<{ priceIdOrPrice: string; quantity: number }>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: CheckoutMetadata;
}): Promise<{ url: string } | null> {
  if (!isStripeConfigured()) return null;
  // TODO: stripe.checkout.sessions.create with metadata, success_url, cancel_url
  return null;
}

/**
 * Verify webhook signature in API route (payment_intent.succeeded, etc.).
 */
export function constructWebhookEvent(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub
  _payload: string | Buffer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub
  _signature: string
): { type: string; data: { object: unknown } } | null {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return null;
  // TODO: stripe.webhooks.constructEvent(payload, signature, secret)
  return null;
}
