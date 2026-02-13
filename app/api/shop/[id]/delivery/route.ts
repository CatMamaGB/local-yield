/**
 * GET /api/shop/[id]/delivery — delivery options for a producer (for checkout).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const { id: producerId } = await params;
    const profile = await prisma.producerProfile.findUnique({
      where: { userId: producerId },
      select: { offersDelivery: true, deliveryFeeCents: true },
    });
    if (!profile) return ok({ offersDelivery: false, deliveryFeeCents: 0 });
    return ok({
      offersDelivery: profile.offersDelivery,
      deliveryFeeCents: profile.deliveryFeeCents,
    });
  } catch (e) {
    logError("shop/[id]/delivery/GET", e, { requestId, path: "/api/shop/[id]/delivery", method: "GET" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
