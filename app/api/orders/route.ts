/**
 * POST /api/orders — create order from cart. Body: { producerId, items: [{ productId, quantity, unitPriceCents }], fulfillmentType, notes? }.
 * Uses cash payment for now. Requires auth (buyer).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { ok, fail, parseJsonBody, addCorsHeaders, handleCorsPreflight, withCorsOnRateLimit } from "@/lib/api";
import { CreateOrderSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { withRequestLogging } from "@/lib/api/with-request-logging";

async function postHandler(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return withCorsOnRateLimit(rateLimitRes, request) ?? rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return addCorsHeaders(fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId }), request);
    }

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return addCorsHeaders(fail(parseError, { code: "INVALID_JSON", status: 400, requestId }), request);
    }

    const validationResult = CreateOrderSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return addCorsHeaders(fail(firstError?.message || "Invalid request", { code: "VALIDATION_ERROR", status: 400, requestId }), request);
    }

    const { producerId, items, fulfillmentType, notes, pickupDate, appliedCreditCents, idempotencyKey } = validationResult.data;

    for (const item of items) {
      if (item.quantity < 1 || item.quantity > 999) {
        return addCorsHeaders(fail(`Quantity must be between 1 and 999 for product ${item.productId}`, { code: "INVALID_QUANTITY", status: 400, requestId }), request);
      }
    }

    const producer = await prisma.user.findFirst({
      where: { id: producerId, isProducer: true },
      include: { producerProfile: { select: { deliveryFeeCents: true, offersDelivery: true } } },
    });

    if (!producer) {
      return addCorsHeaders(fail("Producer not found", { code: "PRODUCER_NOT_FOUND", status: 404, requestId }), request);
    }

    const finalFulfillmentType = fulfillmentType ?? "PICKUP";
    if (finalFulfillmentType === "DELIVERY" && !producer.producerProfile?.offersDelivery) {
      return addCorsHeaders(fail("Producer does not offer delivery", { code: "DELIVERY_NOT_AVAILABLE", status: 400, requestId }), request);
    }

    let deliveryFeeCents = 0;
    if (finalFulfillmentType === "DELIVERY") {
      deliveryFeeCents = producer.producerProfile?.deliveryFeeCents ?? 0;
    }

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
      appliedCreditCents: appliedCreditCents ?? 0,
      idempotencyKey: idempotencyKey ?? undefined,
    });

    if (!result) {
      return addCorsHeaders(fail("Failed to create order", { code: "ORDER_CREATION_FAILED", status: 500, requestId }), request);
    }

    return addCorsHeaders(ok({
      orderId: result.orderId,
      pickupCode: result.pickupCode,
    }, requestId), request);
  } catch (error) {
    logError("orders/POST", error, { requestId, path: "/api/orders", method: "POST" });
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("NOT_FOUND")) {
        return addCorsHeaders(fail(error.message, { code: "NOT_FOUND", status: 404, requestId }), request);
      }
      if (error.message.includes("invalid") || error.message.includes("INVALID")) {
        return addCorsHeaders(fail(error.message, { code: "VALIDATION_ERROR", status: 400, requestId }), request);
      }
      if (error.message.includes("stock") || error.message.includes("STOCK")) {
        return addCorsHeaders(fail(error.message, { code: "OUT_OF_STOCK", status: 400, requestId }), request);
      }
      if (error.message.includes("credit") || (error as { code?: string }).code === "INSUFFICIENT_CREDIT") {
        return addCorsHeaders(fail(error.message, { code: "INSUFFICIENT_CREDIT", status: 400, requestId }), request);
      }
    }
    return addCorsHeaders(fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId }), request);
  }
}

export const POST = withRequestLogging(postHandler);

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
