/**
 * GET /api/account/completion — Returns incomplete profile steps for checklist banner.
 * Used by OnboardingChecklistBanner to show "Complete your profile" when steps are missing.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { getRequestId } from "@/lib/request-id";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });

    const incompleteSteps: string[] = [];

    if (!user.zipCode || !/^\d{5}$/.test(user.zipCode)) {
      incompleteSteps.push("zipCode");
    }

    if (user.isProducer) {
      const pp = await prisma.producerProfile.findUnique({
        where: { userId: user.id },
        select: { aboutUs: true, pickupZipCode: true },
      });
      if (!pp?.aboutUs) incompleteSteps.push("shopName");
      if (!pp?.pickupZipCode && !user.zipCode) incompleteSteps.push("pickupZip");
    }

    if (user.isCaregiver) {
      const cp = await prisma.caregiverProfile.findUnique({
        where: { userId: user.id },
        select: { serviceAreas: true },
      });
      if (!cp?.serviceAreas) incompleteSteps.push("serviceRadius");
    }

    if (user.isHomesteadOwner) {
      const sp = await prisma.careSeekerProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!sp) incompleteSteps.push("propertyZip");
    }

    return ok({ incompleteSteps });
  } catch (e) {
    logError("account/completion/GET", e, { requestId, path: "/api/account/completion", method: "GET" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
