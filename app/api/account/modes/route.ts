/**
 * POST /api/account/modes — Add a capability to the current account (idempotent).
 * Body: { mode: "SELL" | "HELPER" | "HIRE" }.
 * If role already exists, returns 200 with redirect and incompleteSteps (no error).
 * Creates profiles only if missing. Returns redirect target and incompleteSteps for checklist UI.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail, parseJsonBody, withRequestId } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { logError } from "@/lib/logger";
import { Role } from "@prisma/client";

const VALID_MODES = ["SELL", "HELPER", "HIRE"] as const;
type Mode = (typeof VALID_MODES)[number];

const MODE_TO_ROLE: Record<Mode, Role> = {
  SELL: Role.PRODUCER,
  HELPER: Role.CAREGIVER,
  HIRE: Role.CARE_SEEKER,
};

const MODE_TO_REDIRECT: Record<Mode, string> = {
  SELL: "/dashboard",
  HELPER: "/care",
  HIRE: "/care/post-job",
};

export async function POST(request: NextRequest) {
  const requestId = withRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const mode = body?.mode;
    if (!mode || !VALID_MODES.includes(mode)) {
      return fail("mode must be SELL, HELPER, or HIRE", { code: "INVALID_MODE", status: 400, requestId });
    }

    const role = MODE_TO_ROLE[mode];
    const redirectTarget = MODE_TO_REDIRECT[mode];

    const existingRole = await prisma.userRole.findUnique({
      where: { userId_role: { userId: user.id, role } },
    });

    const incompleteSteps: string[] = [];

    if (existingRole) {
      // Idempotent: role already exists; return ok with redirect and checklist hints
      if (mode === "SELL") {
        const pp = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
        if (!pp?.aboutUs) incompleteSteps.push("shopName");
        // Payout setup is external (Stripe); we don't track it in DB here
      }
      if (mode === "HELPER") {
        const cp = await prisma.caregiverProfile.findUnique({ where: { userId: user.id } });
        if (!cp?.serviceAreas) incompleteSteps.push("serviceRadius");
      }
      if (mode === "HIRE") {
        const sp = await prisma.careSeekerProfile.findUnique({ where: { userId: user.id } });
        if (!sp) incompleteSteps.push("propertyZip");
      }
      return ok({ redirect: redirectTarget, incompleteSteps, alreadyEnabled: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRole.create({
        data: { userId: user.id, role },
      });

      const updateFlags: { isProducer?: boolean; isCaregiver?: boolean; isHomesteadOwner?: boolean } = {};
      if (mode === "SELL") {
        updateFlags.isProducer = true;
        await tx.producerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
        incompleteSteps.push("shopName");
      }
      if (mode === "HELPER") {
        updateFlags.isCaregiver = true;
        await tx.caregiverProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
        incompleteSteps.push("serviceRadius");
      }
      if (mode === "HIRE") {
        updateFlags.isHomesteadOwner = true;
        await tx.careSeekerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
        incompleteSteps.push("propertyZip");
      }

      await tx.user.update({
        where: { id: user.id },
        data: updateFlags,
      });
    });

    return ok({ redirect: redirectTarget, incompleteSteps, alreadyEnabled: false });
  } catch (error) {
    logError("account/modes/POST", error, { requestId, path: "/api/account/modes", method: "POST" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
