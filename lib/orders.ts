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

export type FulfillmentType = "PICKUP" | "DELIVERY";

export interface CreateOrderInput {
  buyerId: string;
  producerId: string;
  /** Single product (legacy) or use items for multi-item. */
  productId?: string;
  /** Multi-item: line items with snapshot prices. If set, totalCents and deliveryFeeCents required. */
  items?: Array<{ productId: string; quantity: number; unitPriceCents: number }>;
  /** Required for multi-item; for single productId can be derived from product price. */
  totalCents?: number;
  deliveryFeeCents?: number;
  fulfillmentType?: FulfillmentType;
  paymentMethod: PaymentMethod;
  notes?: string;
  pickupDate?: Date;
  eventId?: string;
}

/**
 * Create an order. Sets resolutionWindowEndsAt from pickupDate + 48h, generates pickupCode.
 * Supports single product (productId) or multi-item (items). For single product, totalCents derived from product if omitted.
 */
export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; pickupCode: string } | null> {
  const pickupDate = input.pickupDate ? (input.pickupDate instanceof Date ? input.pickupDate : new Date(input.pickupDate)) : null;
  const resolutionWindowEndsAt = pickupDate ? new Date(pickupDate.getTime() + RESOLUTION_WINDOW_HOURS * 60 * 60 * 1000) : null;
  const pickupCode = generatePickupCode();
  const fulfillmentType = input.fulfillmentType ?? "PICKUP";
  const deliveryFeeCents = input.deliveryFeeCents ?? 0;

  let totalCents = input.totalCents ?? 0;
  let orderItemsCreate: { productId: string; quantity: number; unitPriceCents: number }[] | undefined;

  if (input.items?.length) {
    orderItemsCreate = input.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    }));
    if (totalCents === 0) {
      totalCents = orderItemsCreate.reduce((sum, i) => sum + i.quantity * i.unitPriceCents, 0) + deliveryFeeCents;
    }
  } else if (input.productId) {
    const product = await prisma.product.findUnique({ where: { id: input.productId }, select: { price: true } });
    if (!product) return null;
    const unitPriceCents = Math.round(product.price * 100);
    if (totalCents === 0) totalCents = unitPriceCents + deliveryFeeCents;
    orderItemsCreate = [{ productId: input.productId, quantity: 1, unitPriceCents }];
  }

  const order = await prisma.order.create({
    data: {
      buyerId: input.buyerId,
      producerId: input.producerId,
      productId: input.productId ?? input.items?.[0]?.productId ?? null,
      notes: input.notes ?? null,
      paid: input.paymentMethod === "card",
      viaCash: input.paymentMethod === "cash",
      status: "PENDING",
      fulfillmentType,
      deliveryFeeCents,
      totalCents,
      pickupDate,
      resolutionWindowEndsAt,
      pickupCode,
      orderItems: orderItemsCreate?.length ? { create: orderItemsCreate } : undefined,
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

/** Orders placed by buyer (for "Your orders"). Includes line items or legacy product. */
export async function getOrdersForBuyer(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId },
    include: {
      product: { select: { id: true, title: true, price: true } },
      orderItems: { include: { product: { select: { id: true, title: true, price: true } } } },
      producer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Orders to fulfill by producer. Includes line items or legacy product. */
export async function getOrdersForProducer(producerId: string) {
  return prisma.order.findMany({
    where: { producerId },
    include: {
      product: { select: { id: true, title: true, price: true } },
      orderItems: { include: { product: { select: { id: true, title: true, price: true } } } },
      buyer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
