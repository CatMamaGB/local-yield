/**
 * POST /api/orders — create order from cart. Body: { producerId, items: [{ productId, quantity, unitPriceCents }], fulfillmentType, notes? }.
 * Uses cash payment for now. Requires auth (buyer).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createOrder } from "@/lib/orders";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const producerId = body.producerId;
  const items = body.items as Array<{ productId: string; quantity: number; unitPriceCents: number }> | undefined;
  const fulfillmentType = body.fulfillmentType === "DELIVERY" ? "DELIVERY" : "PICKUP";
  const notes = body.notes != null ? String(body.notes).trim() || undefined : undefined;

  if (!producerId || !items?.length) {
    return Response.json({ error: "producerId and items required" }, { status: 400 });
  }

  const producer = await prisma.user.findFirst({
    where: { id: producerId, isProducer: true },
    include: { producerProfile: true },
  });
  if (!producer) {
    return Response.json({ error: "Producer not found" }, { status: 404 });
  }

  let deliveryFeeCents = 0;
  if (fulfillmentType === "DELIVERY") {
    deliveryFeeCents = producer.producerProfile?.deliveryFeeCents ?? 0;
  }

  const result = await createOrder({
    buyerId: user.id,
    producerId,
    items: items.map((i) => ({
      productId: i.productId,
      quantity: Math.max(1, Math.min(999, i.quantity)),
      unitPriceCents: i.unitPriceCents,
    })),
    fulfillmentType,
    deliveryFeeCents,
    paymentMethod: "cash",
    notes,
  });

  if (!result) {
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }

  return Response.json({
    orderId: result.orderId,
    pickupCode: result.pickupCode,
  });
}
