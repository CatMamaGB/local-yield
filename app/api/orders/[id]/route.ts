/**
 * PATCH /api/orders/[id] — update order status (e.g. mark fulfilled). Producer or admin only.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";

const ALLOWED_STATUSES = ["PENDING", "PAID", "FULFILLED", "CANCELED", "REFUNDED"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireProducerOrAdmin();
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    if (order.producerId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const status = body.status;
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return Response.json({ error: "Valid status required" }, { status: 400 });
    }

    const updateData: { status: typeof status; fulfilledAt?: Date } = { status };
    if (status === "FULFILLED") {
      updateData.fulfilledAt = new Date();
    }

    await prisma.order.update({
      where: { id },
      data: updateData,
    });
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Forbidden";
    return Response.json({ error: message }, { status: 403 });
  }
}
