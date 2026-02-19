/**
 * Order / checkout helpers for The Local Yield.
 * Sets resolution window (48–72h, configurable) and pickup code for event/pickup; supports card (Stripe) and cash.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type PaymentMethod = "cash" | "card";

// Configurable resolution window (48–72h). Default: 48 hours. Guard against NaN from invalid env.
const rawWindow = Number.parseInt(process.env.RESOLUTION_WINDOW_HOURS ?? "48", 10);
const safeWindow = Number.isFinite(rawWindow) ? rawWindow : 48;
const RESOLUTION_WINDOW_HOURS = Math.min(72, Math.max(48, safeWindow));

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
  /** Store credit to apply (validated against balance and total). */
  appliedCreditCents?: number;
  /** Client-generated key to prevent duplicate orders on retry. */
  idempotencyKey?: string;
}

/**
 * Custom error classes for order creation
 */
export class OrderCreationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "OrderCreationError";
  }
}

/**
 * Create an order. Sets resolutionWindowEndsAt from pickupDate + 48h (or now + 48h if no pickupDate), generates pickupCode.
 * Supports single product (productId) or multi-item (items). For single product, totalCents derived from product if omitted.
 * 
 * Validates:
 * - Users exist (buyer and producer)
 * - Products exist and belong to producer
 * - Inventory availability (if quantityAvailable is set)
 * - Prices from database (snapshot stored in OrderItem)
 * 
 * Uses Prisma transaction for atomicity.
 */
export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; pickupCode: string }> {
  // 3.1 Validate top-level input
  if (!input.buyerId || !input.producerId) {
    throw new OrderCreationError("buyerId and producerId are required", "INVALID_INPUT");
  }

  if (!input.items?.length && !input.productId) {
    throw new OrderCreationError("Either items array or productId is required", "INVALID_INPUT");
  }

  // Normalize items array
  const items = input.items?.length
    ? input.items
    : input.productId
      ? [{ productId: input.productId, quantity: 1, unitPriceCents: 0 }]
      : [];

  if (items.length === 0) {
    throw new OrderCreationError("At least one item is required", "INVALID_INPUT");
  }

  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, pickupCode: true },
    });
    if (existing) {
      return { orderId: existing.id, pickupCode: existing.pickupCode ?? "" };
    }
  }

  // Use transaction for atomicity
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 3.2 Validate users exist (producer: legacy isProducer; prefer userRoles: { some: { role: "PRODUCER" } } when refactoring)
    const [buyer, producer] = await Promise.all([
      tx.user.findUnique({ where: { id: input.buyerId } }),
      tx.user.findUnique({ where: { id: input.producerId, isProducer: true } }),
    ]);

    if (!buyer) {
      throw new OrderCreationError(`Buyer not found: ${input.buyerId}`, "BUYER_NOT_FOUND");
    }

    if (!producer) {
      throw new OrderCreationError(`Producer not found: ${input.producerId}`, "PRODUCER_NOT_FOUND");
    }

    // 3.3 Validate products exist + belong to producer
    const productIds = items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        userId: input.producerId, // Ensure products belong to producer
      },
      select: {
        id: true,
        price: true,
        quantityAvailable: true,
      },
    });

    type ProductInfo = { id: string; price: number; quantityAvailable: number | null };
    const productsTyped = products as ProductInfo[];
    
    if (productsTyped.length !== productIds.length) {
      const foundIds = new Set<string>(productsTyped.map((p: ProductInfo) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new OrderCreationError(
        `Products not found or not owned by producer: ${missingIds.join(", ")}`,
        "PRODUCT_NOT_FOUND"
      );
    }

    // Create product lookup map
    const productMap = new Map<string, ProductInfo>(productsTyped.map((p: ProductInfo) => [p.id, p]));

    // 3.4 Enforce price source: Always price from DB at time of order creation
    // Store snapshot into OrderItem.unitPriceCents
    const orderItemsCreate: { productId: string; quantity: number; unitPriceCents: number }[] = [];
    let totalCents = input.totalCents ?? 0;

    for (const item of items) {
      const product: ProductInfo | undefined = productMap.get(item.productId);
      if (!product) {
        throw new OrderCreationError(`Product not found: ${item.productId}`, "PRODUCT_NOT_FOUND");
      }

      // 3.5 Enforce inventory
      if (product.quantityAvailable !== null) {
        // null means unlimited, so only check if quantityAvailable is set
        if (product.quantityAvailable < item.quantity) {
          throw new OrderCreationError(
            `Insufficient stock for product ${item.productId}. Available: ${product.quantityAvailable}, Requested: ${item.quantity}`,
            "OUT_OF_STOCK"
          );
        }
      }

      // Price from database (snapshot)
      const unitPriceCents = Math.round(product.price * 100);
      orderItemsCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents,
      });
    }

    // Calculate total if not provided
    if (totalCents === 0) {
      totalCents = orderItemsCreate.reduce((sum, i) => sum + i.quantity * i.unitPriceCents, 0) + (input.deliveryFeeCents ?? 0);
    }

    const appliedCreditCents = Math.max(0, Math.min(input.appliedCreditCents ?? 0, totalCents));
    if (appliedCreditCents > 0) {
      const balanceResult = await tx.creditLedger.aggregate({
        where: { userId: input.buyerId, producerId: input.producerId },
        _sum: { amountCents: true },
      });
      const balance = balanceResult._sum.amountCents ?? 0;
      if (appliedCreditCents > balance) {
        throw new OrderCreationError(
          `Insufficient store credit. Available: $${(balance / 100).toFixed(2)}, requested: $${(appliedCreditCents / 100).toFixed(2)}`,
          "INSUFFICIENT_CREDIT"
        );
      }
    }

    const stripeChargeCents = totalCents - appliedCreditCents;
    const creditOnly = appliedCreditCents === totalCents;

    // 3.7 Fix resolution window logic: Always set it (use now + 48h if no pickupDate)
    const pickupDate = input.pickupDate
      ? input.pickupDate instanceof Date
        ? input.pickupDate
        : new Date(input.pickupDate)
      : null;

    // Set resolution window: if pickupDate exists, use it; otherwise use now + 48h
    const resolutionWindowEndsAt = pickupDate
      ? new Date(pickupDate.getTime() + RESOLUTION_WINDOW_HOURS * 60 * 60 * 1000)
      : new Date(Date.now() + RESOLUTION_WINDOW_HOURS * 60 * 60 * 1000);

    const pickupCode = generatePickupCode();
    const fulfillmentType = input.fulfillmentType ?? "PICKUP";
    const deliveryFeeCents = input.deliveryFeeCents ?? 0;

    // Paid state: credit-only orders are paid immediately; otherwise set by Stripe webhook or producer PATCH.
    const order = await tx.order.create({
      data: {
        buyerId: input.buyerId,
        producerId: input.producerId,
        productId: input.productId ?? items[0]?.productId ?? null,
        notes: input.notes ?? null,
        paid: creditOnly, // Credit-only: paid immediately; else webhook or PATCH
        viaCash: input.paymentMethod === "cash",
        status: "PENDING",
        fulfillmentType,
        deliveryFeeCents,
        totalCents,
        creditAppliedCents: appliedCreditCents,
        stripeChargeCents: stripeChargeCents > 0 ? stripeChargeCents : null,
        idempotencyKey: input.idempotencyKey ?? null,
        pickupDate,
        resolutionWindowEndsAt,
        pickupCode,
        orderItems: {
          create: orderItemsCreate,
        },
      },
    });

    if (appliedCreditCents > 0) {
      await tx.creditLedger.create({
        data: {
          userId: input.buyerId,
          producerId: input.producerId,
          amountCents: -appliedCreditCents,
          reason: "CREDIT_REDEMPTION",
          orderId: order.id,
          createdById: input.buyerId,
        },
      });
    }

    return { orderId: order.id, pickupCode };
  });
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

/** Single order by id; returns null if not found or user is not buyer/producer/admin. */
export async function getOrderByIdForUser(orderId: string, userId: string, isAdmin: boolean) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: { select: { id: true, title: true, price: true, delivery: true } },
      orderItems: { include: { product: { select: { id: true, title: true, price: true } } } },
      buyer: { select: { id: true, name: true, email: true } },
      producer: { select: { id: true, name: true } },
    },
  });
  if (!order) return null;
  if (isAdmin || order.buyerId === userId || order.producerId === userId) return order;
  return null;
}

/** Paid or fulfilled orders for producer — lightweight for analytics pages. */
export async function getPaidOrdersForProducer(producerId: string) {
  return prisma.order.findMany({
    where: {
      producerId,
      status: { in: ["PAID", "FULFILLED"] },
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      totalCents: true,
      buyer: { select: { name: true } },
      product: { select: { title: true } },
      orderItems: {
        select: {
          product: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
