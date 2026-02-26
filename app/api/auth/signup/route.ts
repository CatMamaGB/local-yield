/**
 * POST /api/auth/signup — Create customer profile (identity + contact + location + roles).
 * Validates with SignupSchema; creates User, UserRole rows, and role-specific profiles.
 * In dev: sets session cookies and returns redirect to /auth/onboarding.
 * Admin is never selectable.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody, withRequestId } from "@/lib/api";
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

function isClerkConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export async function POST(request: NextRequest) {
  const requestId = withRequestId(request);
  // In production with Clerk, sign-up is handled by Clerk; this endpoint is dev/stub-only.
  if (isClerkConfigured() && process.env.NODE_ENV === "production") {
    return fail("Sign-up is not available here. Use the app sign-up flow.", { code: "NOT_AVAILABLE", status: 404, requestId });
  }
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.AUTH, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });

    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().formErrors?.[0] ?? parsed.error.message ?? "Validation failed";
      return fail(String(msg), { code: "VALIDATION_ERROR", status: 400, requestId });
    }
    const data = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return fail("An account with this email already exists", { code: "EMAIL_TAKEN", status: 409, requestId });

    // Buyer is always on; signup form only sends "what else" (PRODUCER, CAREGIVER, CARE_SEEKER).
    const normalizedRoles = [...new Set([...data.roles, "BUYER"])];
    const isBuyer = true;
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

    const zipValue =
      data.zipCode && typeof data.zipCode === "string" && /^\d{5}$/.test(data.zipCode.trim())
        ? data.zipCode.trim().slice(0, 5)
        : null;
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name.trim() || null,
        phone: data.phone.trim(),
        zipCode: zipValue,
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

    const res = ok({ redirect: "/auth/onboarding" }, requestId);

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
    return fail("Something went wrong. Please try again.", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
