/**
 * POST /api/orders/[id]/credit — Issue store credit for an order (producer or admin).
 * Body: { amountCents, reason, reportId? }. Order must be PAID or FULFILLED; producer cannot exceed order total.
 */

import { NextRequest } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueCredit } from "@/lib/credits";
import { ok, fail, parseJsonBody, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";
import { z } from "zod";

const IssueCreditSchema = z.object({
  amountCents: z.number().int().min(1),
  reason: z.enum(["DISPUTE_RESOLUTION", "GOODWILL", "ADJUSTMENT"]),
  reportId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = withRequestId(request);
  const user = await getCurrentUser();
  if (!user) {
    return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
  }

  const { id: orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, buyerId: true, producerId: true, status: true, totalCents: true },
  });
  if (!order) {
    return fail("Order not found", { code: "NOT_FOUND", status: 404, requestId });
  }

  const isAdmin = await requireAdmin().then(() => true).catch(() => false);
  const isProducer = order.producerId === user.id;

  if (!isAdmin && !isProducer) {
    return fail("Only the producer or admin can issue credit for this order", { code: "FORBIDDEN", status: 403, requestId });
  }

  if (order.buyerId === order.producerId) {
    return fail("Cannot issue credit to yourself", { code: "VALIDATION_ERROR", status: 400, requestId });
  }

  if (order.status !== "PAID" && order.status !== "FULFILLED") {
    return fail("Credit can only be issued for PAID or FULFILLED orders", { code: "VALIDATION_ERROR", status: 400, requestId });
  }

  const { data: body, error: parseError } = await parseJsonBody(request);
  if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });

  const validation = IssueCreditSchema.safeParse(body);
  if (!validation.success) {
    const first = validation.error.issues[0];
    return fail(first?.message ?? "Invalid request", { code: "VALIDATION_ERROR", status: 400, requestId });
  }

  const { amountCents, reason, reportId } = validation.data;
  if (!reportId && reason === "DISPUTE_RESOLUTION") {
    return fail("reportId required for DISPUTE_RESOLUTION", { code: "VALIDATION_ERROR", status: 400, requestId });
  }

  const cap = order.totalCents ?? 0;
  if (!isAdmin && amountCents > cap) {
    return fail(`Amount cannot exceed order total ($${(cap / 100).toFixed(2)})`, { code: "VALIDATION_ERROR", status: 400, requestId });
  }

  try {
    await issueCredit({
      userId: order.buyerId,
      producerId: order.producerId,
      amountCents,
      reason,
      orderId: order.id,
      reportId: reportId ?? null,
      createdById: user.id,
    });
    return ok({ ok: true, message: "Credit issued. This credit can only be used in your shop." }, requestId);
  } catch (e) {
    logError("orders/[id]/credit/POST", e, { requestId, path: "/api/orders/[id]/credit", method: "POST" });
    const msg = e instanceof Error ? e.message : "Failed to issue credit";
    return fail(msg, { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
