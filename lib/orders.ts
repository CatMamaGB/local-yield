/**
 * Order / checkout helpers for The Local Yield.
 * Sets resolution window (48h) and pickup code for event/pickup; supports card (Stripe) and cash.
 */

import { prisma } from "./prisma";

export type PaymentMethod = "cash" | "card";

/** Resolution window: buyer cannot publish negative public review until this many hours after pickup. */
const RESOLUTION_WINDOW_HOURS = 48;

function generatePickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface CreateOrderInput {
  buyerId: string;
  producerId: string;
  productId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  pickupDate: Date;
  /** Optional event ID when order is for event pickup (for QR flow). */
  eventId?: string;
}

/**
 * Create an order. Sets resolutionWindowEndsAt = pickupDate + 48h and generates pickupCode.
 */
export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; pickupCode: string } | null> {
  const pickupDate = input.pickupDate instanceof Date ? input.pickupDate : new Date(input.pickupDate);
  const resolutionWindowEndsAt = new Date(pickupDate.getTime() + RESOLUTION_WINDOW_HOURS * 60 * 60 * 1000);
  const pickupCode = generatePickupCode();
  const order = await prisma.order.create({
    data: {
      buyerId: input.buyerId,
      producerId: input.producerId,
      productId: input.productId,
      notes: input.notes ?? null,
      paid: input.paymentMethod === "card",
      viaCash: input.paymentMethod === "cash",
      pickupDate,
      resolutionWindowEndsAt,
      pickupCode,
    },
  });
  return { orderId: order.id, pickupCode };
}

/**
 * For card: redirect to Stripe Checkout, then create order on success (webhook).
 * For cash: create order with viaCash true via createOrder.
 * Phase 1: Stub. Implement in Phase 1.5/2 when Stripe is wired.
 */
export async function initiateCheckout(_params: {
  orderInput: CreateOrderInput;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ redirectUrl: string | null }> {
  return { redirectUrl: null };
}

/** Orders placed by buyer (for "Your orders"). */
export async function getOrdersForBuyer(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId },
    include: {
      product: { select: { id: true, title: true, price: true } },
      producer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Orders to fulfill by producer. */
export async function getOrdersForProducer(producerId: string) {
  return prisma.order.findMany({
    where: { producerId },
    include: {
      product: { select: { id: true, title: true, price: true } },
      buyer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
