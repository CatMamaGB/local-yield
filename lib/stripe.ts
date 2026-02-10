/**
 * Stripe integration for The Local Yield.
 * Phase 1: Stub only — no keys, no checkout. Add when you’re ready for card payments & payouts.
 */

/** Phase 1: Always false. Set up STRIPE_SECRET_KEY in Phase 1.5/2. */
export function isStripeConfigured(): boolean {
  return false;
}

/**
 * Create a Checkout session (local pickup, no shipping).
 * Phase 1: Returns null. Implement when adding Stripe.
 */
export async function createCheckoutSession(_params: {
  lineItems: Array<{ priceIdOrPrice: string; quantity: number }>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}): Promise<null> {
  return null;
}

/**
 * Verify webhook signature in API route.
 * Phase 1: Returns null. Implement when adding Stripe webhooks.
 */
export function constructWebhookEvent(
  _payload: string | Buffer,
  _signature: string
): null {
  return null;
}
