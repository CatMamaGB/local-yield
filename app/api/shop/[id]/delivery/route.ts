/**
 * GET /api/shop/[id]/delivery — delivery options for a producer (for checkout).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: producerId } = await params;
  const profile = await prisma.producerProfile.findUnique({
    where: { userId: producerId },
    select: { offersDelivery: true, deliveryFeeCents: true },
  });
  if (!profile) {
    return Response.json({ offersDelivery: false, deliveryFeeCents: 0 });
  }
  return Response.json({
    offersDelivery: profile.offersDelivery,
    deliveryFeeCents: profile.deliveryFeeCents,
  });
}
