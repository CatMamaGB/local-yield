/**
 * POST /api/auth/signup — Create customer profile (identity + contact + location + roles).
 * Validates with SignupSchema; creates User, UserRole rows, and role-specific profiles.
 * In dev: sets session cookies and returns redirect to /auth/onboarding.
 * Admin is never selectable.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { SignupSchema } from "@/lib/validators";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { PlatformUse, Role, PrimaryMode } from "@prisma/client";

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
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.AUTH);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, "INVALID_JSON", 400);

    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().formErrors?.[0] ?? parsed.error.message ?? "Validation failed";
      return fail(String(msg), "VALIDATION_ERROR", 400);
    }
    const data = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return fail("An account with this email already exists", "EMAIL_TAKEN", 409);

    const normalizedRoles = [...new Set(data.roles)];
    const isBuyer = normalizedRoles.includes("BUYER");
    const isProducer = normalizedRoles.includes("PRODUCER");
    const isCaregiver = normalizedRoles.includes("CAREGIVER");
    const isHomesteadOwner = normalizedRoles.includes("CARE_SEEKER");
    const primaryRole = isProducer ? Role.PRODUCER : Role.BUYER;
    
    // Convert string primaryMode to enum
    const primaryModeEnum = data.primaryMode === "MARKET" ? PrimaryMode.MARKET 
      : data.primaryMode === "SELL" ? PrimaryMode.SELL 
      : PrimaryMode.CARE;
    
    const platformUse = derivePlatformUse(normalizedRoles, primaryModeEnum);

    const userRolesCreate = normalizedRoles
      .map((r) => SIGNUP_TO_PRISMA_ROLE[r])
      .filter(Boolean)
      .map((role) => ({ role }));

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name.trim() || null,
        phone: data.phone.trim(),
        zipCode: data.zipCode,
        addressLine1: data.addressLine1?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        platformUse,
        primaryMode: primaryModeEnum,
        role: primaryRole,
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

    if (process.env.NODE_ENV === "development") {
      res.cookies.set("__dev_user_id", user.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
      res.cookies.set("__dev_user", primaryRole, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
    }

    return res;
  } catch (error) {
    console.error("Signup error:", error);
    return fail("Something went wrong. Please try again.", "INTERNAL_ERROR", 500);
  }
}
