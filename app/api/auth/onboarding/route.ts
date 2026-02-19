/**
 * POST /api/auth/onboarding — Sets termsAcceptedAt, onboardingCompletedAt, ZIP (optional), roles, primaryMode.
 * Only hard-require termsAccepted. Redirect uses getPostLoginRedirect (lastActiveMode → market).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPostLoginRedirect } from "@/lib/redirects";
import { ok, fail, parseJsonBody, withRequestId } from "@/lib/api";
import { OnboardingSchema } from "@/lib/validators";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { logError } from "@/lib/logger";
import { Role, PrimaryMode } from "@prisma/client";

const SIGNUP_TO_PRISMA_ROLE: Record<string, Role> = {
  BUYER: Role.BUYER,
  PRODUCER: Role.PRODUCER,
  CAREGIVER: Role.CAREGIVER,
  CARE_SEEKER: Role.CARE_SEEKER,
};

export async function POST(request: NextRequest) {
  const requestId = withRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.AUTH, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const validationResult = OnboardingSchema.safeParse(body);
    if (!validationResult.success) {
      const msg = validationResult.error.flatten().formErrors?.[0] ?? "Invalid request";
      return fail(String(msg), { code: "VALIDATION_ERROR", status: 400, requestId });
    }
    const { termsAccepted, zipCode: zip, roles: roleIds, primaryMode, requestedUrl } = validationResult.data;

    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });

    // Buyer is always on; form only sends "what else" (PRODUCER, CAREGIVER, CARE_SEEKER).
    const roleIdsWithBuyer =
      roleIds != null && roleIds.length > 0
        ? roleIds.includes("BUYER")
          ? roleIds
          : [...roleIds, "BUYER"]
        : ["BUYER"];
    const isBuyer = true;
    const isProducer = roleIdsWithBuyer?.includes("PRODUCER") ?? undefined;
    const isCaregiver = roleIdsWithBuyer?.includes("CAREGIVER") ?? undefined;
    const isHomesteadOwner = roleIdsWithBuyer?.includes("CARE_SEEKER") ?? undefined;

    const now = new Date();
    const zipValue: string | null =
      zip && zip !== "" && /^\d{5}$/.test(zip)
        ? zip
        : user.zipCode && /^\d{5}$/.test(user.zipCode)
          ? user.zipCode
          : null;
    const updateData: {
      zipCode?: string | { set: null };
      onboardedAt: Date;
      termsAcceptedAt: Date;
      onboardingCompletedAt: Date;
      primaryMode?: PrimaryMode;
      role?: Role;
      isBuyer?: boolean;
      isProducer?: boolean;
      isCaregiver?: boolean;
      isHomesteadOwner?: boolean;
    } = {
      zipCode: zipValue !== null ? zipValue : { set: null },
      onboardedAt: now,
      termsAcceptedAt: now,
      onboardingCompletedAt: now,
    };
    
    if (primaryMode) {
      updateData.primaryMode = primaryMode === "MARKET" ? PrimaryMode.MARKET
        : primaryMode === "SELL" ? PrimaryMode.SELL
        : PrimaryMode.CARE;
    }
    
    updateData.isBuyer = true;
    updateData.isProducer = isProducer ?? false;
    updateData.isCaregiver = isCaregiver ?? false;
    updateData.isHomesteadOwner = isHomesteadOwner ?? false;
    updateData.role = isProducer ? Role.PRODUCER : Role.BUYER;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: updateData as Parameters<typeof tx.user.update>[0]["data"],
      });

      await tx.userRole.deleteMany({ where: { userId: user.id } });
      for (const r of roleIdsWithBuyer) {
        const prismaRole = SIGNUP_TO_PRISMA_ROLE[r];
        if (prismaRole) await tx.userRole.create({ data: { userId: user.id, role: prismaRole } });
      }

      if (isProducer) {
        await tx.producerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      }
      if (isCaregiver) {
        await tx.caregiverProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      }
      if (isHomesteadOwner) {
        await tx.careSeekerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      }

      return u;
    });

    const lastActiveMode = request.cookies.get("__last_active_mode")?.value ?? undefined;
    const redirectPath = getPostLoginRedirect(lastActiveMode, { requestedUrl: requestedUrl ?? undefined });
    const res = ok({ redirect: redirectPath });
    if (zipValue) {
      res.cookies.set("__dev_zip", zipValue, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  } catch (error) {
    const requestId = getRequestId(request);
    logError("auth/onboarding/POST", error, { requestId, path: "/api/auth/onboarding", method: "POST" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
