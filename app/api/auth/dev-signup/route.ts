/**
 * POST /api/auth/dev-signup — development-only. Creates a new user with selected roles (array).
 * Body: { roles: ("BUYER" | "PRODUCER" | "CAREGIVER" | "CARE_SEEKER")[] }
 * Admin is never allowed; only existing admins can assign ADMIN.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { SignUpRoleSchema } from "@/lib/validators";
import { getRequestId } from "@/lib/request-id";
import { logError } from "@/lib/logger";
import { PlatformUse, Role, PrimaryMode } from "@prisma/client";
import { z } from "zod";

const BodySchema = z.object({
  roles: z.array(SignUpRoleSchema).min(1, "Select at least one role"),
});

const SIGNUP_TO_PRISMA_ROLE: Record<string, Role> = {
  BUYER: Role.BUYER,
  PRODUCER: Role.PRODUCER,
  CAREGIVER: Role.CAREGIVER,
  CARE_SEEKER: Role.CARE_SEEKER,
};

function derivePlatformUse(roles: string[], primaryMode: PrimaryMode): PlatformUse {
  const hasBuyer = roles.includes("BUYER");
  const hasProducer = roles.includes("PRODUCER");
  const hasCaregiver = roles.includes("CAREGIVER");
  const hasCareSeeker = roles.includes("CARE_SEEKER");
  const hasMarketRole = hasBuyer || hasProducer;
  const hasCareRole = hasCaregiver || hasCareSeeker;

  if (hasMarketRole && hasCareRole) return PlatformUse.BOTH_MARKET_AND_CARE;
  if (primaryMode === PrimaryMode.SELL || hasProducer) return PlatformUse.SELL_PRODUCTS;

  if (primaryMode === PrimaryMode.CARE || hasCareRole) {
    if (hasCaregiver && !hasCareSeeker) return PlatformUse.OFFER_ANIMAL_CARE;
    if (hasCareSeeker && !hasCaregiver) return PlatformUse.FIND_ANIMAL_CARE;
    return PlatformUse.OTHER;
  }

  if (hasBuyer) return PlatformUse.BUY_LOCAL_GOODS;
  return PlatformUse.OTHER;
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return fail("Not available", { code: "NOT_AVAILABLE", status: 404 });
  }

  try {
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.flatten().formErrors?.[0] ?? "Invalid roles", { code: "INVALID_ROLES", status: 400 });
    }
    const normalizedRoles = [...new Set(parsed.data.roles)];

    const isBuyer = normalizedRoles.includes("BUYER");
    const isProducer = normalizedRoles.includes("PRODUCER");
    const isCaregiver = normalizedRoles.includes("CAREGIVER");
    const isHomesteadOwner = normalizedRoles.includes("CARE_SEEKER");
    const primaryRole = isProducer ? Role.PRODUCER : Role.BUYER;
    const primaryMode = isProducer ? PrimaryMode.SELL : isCaregiver || isHomesteadOwner ? PrimaryMode.CARE : PrimaryMode.MARKET;
    const platformUse = derivePlatformUse(normalizedRoles, primaryMode);

    const userRolesCreate = normalizedRoles
      .map((r) => SIGNUP_TO_PRISMA_ROLE[r])
      .filter(Boolean)
      .map((role) => ({ role }));

    const user = await prisma.user.create({
      data: {
        email: `dev-${Date.now()}@test.localyield.example`,
        name: "Dev User",
        phone: "000-000-0000",
        zipCode: null,
        role: primaryRole,
        primaryMode,
        platformUse,
        isBuyer,
        isProducer,
        isCaregiver,
        isHomesteadOwner,
        userRoles: {
          create: userRolesCreate,
        },
        ...(isProducer ? { producerProfile: { create: {} } } : {}),
        ...(isCaregiver ? { caregiverProfile: { create: {} } } : {}),
        ...(isHomesteadOwner ? { careSeekerProfile: { create: {} } } : {}),
      },
    });

    const res = ok({ redirect: "/auth/onboarding" });
    const isProduction = (process.env.NODE_ENV as string) === "production";
    res.cookies.set("__dev_user_id", user.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    });
    res.cookies.set("__dev_user", primaryRole, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    });
    return res;
  } catch (error) {
    const requestId = getRequestId(request);
    logError("auth/dev-signup/POST", error, { requestId, path: "/api/auth/dev-signup", method: "POST" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
