/**
 * POST /api/orders — create order from cart. Body: { producerId, items: [{ productId, quantity, unitPriceCents }], fulfillmentType, notes? }.
 * Uses cash payment for now. Requires auth (buyer).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { CreateOrderSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Parse and validate request body
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return fail(parseError, "INVALID_JSON", 400);
    }

    // Validate request body with Zod
    const validationResult = CreateOrderSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return fail(firstError?.message || "Invalid request", "VALIDATION_ERROR", 400);
    }

    const { producerId, items, fulfillmentType, notes, pickupDate } = validationResult.data;

    // Validate quantities (reject invalid, don't clamp silently)
    for (const item of items) {
      if (item.quantity < 1 || item.quantity > 999) {
        return fail(`Quantity must be between 1 and 999 for product ${item.productId}`, "INVALID_QUANTITY", 400);
      }
    }

    // Fetch producer and delivery settings (legacy isProducer; prefer userRoles: { some: { role: "PRODUCER" } } when refactoring)
    const producer = await prisma.user.findFirst({
      where: { id: producerId, isProducer: true },
      include: { producerProfile: { select: { deliveryFeeCents: true, offersDelivery: true } } },
    });

    if (!producer) {
      return fail("Producer not found", "PRODUCER_NOT_FOUND", 404);
    }

    // Validate fulfillment type
    const finalFulfillmentType = fulfillmentType ?? "PICKUP";
    if (finalFulfillmentType === "DELIVERY" && !producer.producerProfile?.offersDelivery) {
      return fail("Producer does not offer delivery", "DELIVERY_NOT_AVAILABLE", 400);
    }

    let deliveryFeeCents = 0;
    if (finalFulfillmentType === "DELIVERY") {
      deliveryFeeCents = producer.producerProfile?.deliveryFeeCents ?? 0;
    }

    // Create order (createOrder handles all validation internally)
    const result = await createOrder({
      buyerId: user.id,
      producerId,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
      fulfillmentType: finalFulfillmentType,
      deliveryFeeCents,
      paymentMethod: "cash",
      notes: notes?.trim() || undefined,
      pickupDate: pickupDate ? new Date(pickupDate) : undefined,
    });

    if (!result) {
      return fail("Failed to create order", "ORDER_CREATION_FAILED", 500);
    }

    return ok({
      orderId: result.orderId,
      pickupCode: result.pickupCode,
    });
  } catch (error) {
    logError("orders/POST", error, { requestId, path: "/api/orders", method: "POST" });
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("NOT_FOUND")) {
        return fail(error.message, "NOT_FOUND", 404);
      }
      if (error.message.includes("invalid") || error.message.includes("INVALID")) {
        return fail(error.message, "VALIDATION_ERROR", 400);
      }
      if (error.message.includes("stock") || error.message.includes("STOCK")) {
        return fail(error.message, "OUT_OF_STOCK", 400);
      }
    }
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
