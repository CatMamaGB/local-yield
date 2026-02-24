/**
 * GET /api/orders/[id] — order detail for buyer, producer, or admin (tracking view).
 * PATCH /api/orders/[id] — update order status (e.g. mark fulfilled). Producer or admin only.
 */

import { NextRequest } from "next/server";
import { getCurrentUser, requireProducerOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrderByIdForUser } from "@/lib/orders";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { UpdateOrderStatusSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { withRequestLogging } from "@/lib/api/with-request-logging";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELED" | "REFUNDED";

/**
 * Valid status transitions map
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELED"],
  PAID: ["FULFILLED", "CANCELED", "REFUNDED"],
  FULFILLED: [], // Terminal state
  CANCELED: [], // Terminal state
  REFUNDED: [], // Terminal state
};

function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

async function getOrderHandler(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });

    const { id } = await (context?.params ?? Promise.resolve({ id: "" }));
    if (!id) return fail("Order ID required", { code: "VALIDATION_ERROR", status: 400, requestId });
    const order = await getOrderByIdForUser(id, user.id, user.role === "ADMIN");
    if (!order) {
      return fail("Order not found", { code: "NOT_FOUND", status: 404, requestId });
    }

    const title =
      order.orderItems.length > 0
        ? order.orderItems.length === 1
          ? order.orderItems[0].product.title
          : `${order.orderItems.length} items`
        : order.product?.title ?? "Order";

    return ok({
      id: order.id,
      title,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      totalCents: order.totalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      pickupCode: order.pickupCode,
      pickupDate: order.pickupDate?.toISOString() ?? null,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      fulfilledAt: order.fulfilledAt?.toISOString() ?? null,
      paidAt: order.paidAt?.toISOString() ?? null,
      buyer: order.buyer,
      producer: order.producer,
      orderItems: order.orderItems.map((oi) => ({
        id: oi.id,
        quantity: oi.quantity,
        unitPriceCents: oi.unitPriceCents,
        product: oi.product,
      })),
      product: order.product,
      isBuyer: order.buyerId === user.id,
      isProducer: order.producerId === user.id,
    });
  } catch (e) {
    logError("orders/[id]/GET", e, { requestId, path: "/api/orders/[id]", method: "GET" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}

async function patchHandler(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { id } = await (context?.params ?? Promise.resolve({ id: "" }));
    if (!id) return fail("Order ID required", { code: "VALIDATION_ERROR", status: 400, requestId });

    // Fetch current order (include viaCash for paid-state guardrail)
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, producerId: true, viaCash: true },
    });

    if (!order) {
      return fail("Order not found", { code: "NOT_FOUND", status: 404, requestId });
    }

    // Authorization check
    if (order.producerId !== user.id && user.role !== "ADMIN") {
      return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
    }

    // Parse and validate request body
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });
    }

    // Validate status with Zod
    const validationResult = UpdateOrderStatusSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return fail(firstError?.message || "Invalid status", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const newStatus = validationResult.data.status as OrderStatus;
    const currentStatus = order.status as OrderStatus;

    // Validate status transition
    if (currentStatus === newStatus) {
      return fail(`Order is already ${newStatus}`, { code: "NO_CHANGE", status: 400, requestId });
    }

    if (!isValidTransition(currentStatus, newStatus)) {
      return fail(`Invalid status transition: ${currentStatus} → ${newStatus}`, {
        code: "INVALID_TRANSITION",
        status: 400,
        requestId,
      });
    }

    // Only allow PENDING → PAID when order is cash (viaCash). Card payments must be confirmed via Stripe webhook.
    if (newStatus === "PAID" && currentStatus === "PENDING" && !order.viaCash) {
      return fail("Order cannot be marked PAID here; card payments require Stripe confirmation", {
        code: "INVALID_TRANSITION",
        status: 400,
        requestId,
      });
    }

    // Prepare update data
    const updateData: { status: OrderStatus; fulfilledAt?: Date; paidAt?: Date } = {
      status: newStatus,
    };

    if (newStatus === "FULFILLED") {
      updateData.fulfilledAt = new Date();
    }

    if (newStatus === "PAID" && currentStatus === "PENDING") {
      updateData.paidAt = new Date();
    }

    // Update order
    await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return ok({ status: newStatus });
  } catch (error) {
    logError("orders/PATCH", error, { requestId, path: "/api/orders/[id]", method: "PATCH" });
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return fail(error.message, { code: "FORBIDDEN", status: 403, requestId });
    }
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}

export const GET = withRequestLogging(getOrderHandler);
export const PATCH = withRequestLogging(patchHandler);
