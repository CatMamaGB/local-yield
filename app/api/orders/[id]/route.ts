/**
 * PATCH /api/orders/[id] — update order status (e.g. mark fulfilled). Producer or admin only.
 * Validates status transitions to prevent invalid state changes.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { UpdateOrderStatusSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { id } = await params;

    // Fetch current order (include viaCash for paid-state guardrail)
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, producerId: true, viaCash: true },
    });

    if (!order) {
      return fail("Order not found", "NOT_FOUND", 404);
    }

    // Authorization check
    if (order.producerId !== user.id && user.role !== "ADMIN") {
      return fail("Forbidden", "FORBIDDEN", 403);
    }

    // Parse and validate request body
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return fail(parseError, "INVALID_JSON", 400);
    }

    // Validate status with Zod
    const validationResult = UpdateOrderStatusSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return fail(firstError?.message || "Invalid status", "VALIDATION_ERROR", 400);
    }

    const newStatus = validationResult.data.status as OrderStatus;
    const currentStatus = order.status as OrderStatus;

    // Validate status transition
    if (currentStatus === newStatus) {
      return fail(`Order is already ${newStatus}`, "NO_CHANGE", 400);
    }

    if (!isValidTransition(currentStatus, newStatus)) {
      return fail(
        `Invalid status transition: ${currentStatus} → ${newStatus}`,
        "INVALID_TRANSITION",
        400
      );
    }

    // Only allow PENDING → PAID when order is cash (viaCash). Card payments must be confirmed via Stripe webhook.
    if (newStatus === "PAID" && currentStatus === "PENDING" && !order.viaCash) {
      return fail(
        "Order cannot be marked PAID here; card payments require Stripe confirmation",
        "INVALID_TRANSITION",
        400
      );
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
      return fail(error.message, "FORBIDDEN", 403);
    }
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
