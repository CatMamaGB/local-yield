/**
 * POST /api/auth/dev-login — development-only. Sets __dev_user_id and __dev_user cookies and upserts stub user in DB.
 * Body: { role: "BUYER" | "PRODUCER" | "ADMIN" }
 * Finds user by stub email (so seed-created users work); syncs role and sets cookie with actual user id.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { logError } from "@/lib/logger";
import { getPostLoginRedirect, sanitizeNextPath } from "@/lib/redirects";
import { PlatformUse, Role, PrimaryMode } from "@prisma/client";

const VALID_ROLES = ["BUYER", "PRODUCER", "ADMIN"] as const;
type DevRole = (typeof VALID_ROLES)[number];

const DEV_TO_PRISMA_ROLE: Record<DevRole, Role> = {
  BUYER: Role.BUYER,
  PRODUCER: Role.PRODUCER,
  ADMIN: Role.ADMIN,
};

const STUB_EMAILS: Record<DevRole, string> = {
  BUYER: "buyer@test.localyield.example",
  PRODUCER: "producer@test.localyield.example",
  ADMIN: "admin@test.localyield.example",
};

const STUB_NAMES: Record<DevRole, string> = {
  BUYER: "Test Buyer",
  PRODUCER: "Test Producer",
  ADMIN: "Test Admin",
};

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  if (process.env.NODE_ENV !== "development") {
    return fail("Not available", { code: "NOT_AVAILABLE", status: 404, requestId });
  }
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.AUTH, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });
    }

    if (process.env.NODE_ENV === "development") {
      console.log("DEV LOGIN BODY:", body);
    }

    const role = body?.role;
    if (!role || !VALID_ROLES.includes(role)) {
      return fail("Invalid role; use BUYER, PRODUCER, or ADMIN", { code: "INVALID_ROLE", status: 400, requestId });
    }

    const email = STUB_EMAILS[role as DevRole];
    const name = STUB_NAMES[role as DevRole];
    const primaryMode = role === "BUYER" ? PrimaryMode.MARKET : PrimaryMode.SELL;
    const platformUse = role === "BUYER" ? PlatformUse.BUY_LOCAL_GOODS : PlatformUse.SELL_PRODUCTS;
    const prismaRole = DEV_TO_PRISMA_ROLE[role as DevRole];

    // Upsert by email so we work with seed-created users (they use same emails, arbitrary ids).
    const user = await prisma.$transaction(async (tx) => {
      const upserted = await tx.user.upsert({
        where: { email },
        create: {
          email,
          name,
          phone: "",
          zipCode: "90210",
          role: prismaRole,
          primaryMode,
          platformUse,
          isBuyer: role === "BUYER",
          isProducer: role === "PRODUCER" || role === "ADMIN",
          isCaregiver: false,
          isHomesteadOwner: false,
        },
        update: {
          name,
          role: prismaRole,
          primaryMode,
          platformUse,
          isBuyer: role === "BUYER",
          isProducer: role === "PRODUCER" || role === "ADMIN",
          isCaregiver: false,
          isHomesteadOwner: false,
        },
      });

      await tx.userRole.deleteMany({ where: { userId: upserted.id } });
      await tx.userRole.create({
        data: { userId: upserted.id, role: prismaRole },
      });

      return upserted.id;
    });

    const userId = user;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardedAt: true },
    });
    const goToOnboarding = !dbUser?.onboardedAt;

    if (process.env.NODE_ENV === "development") {
      console.log("DEV LOGIN CREATED/FOUND USER:", userId);
    }

    const lastActiveMode = request.cookies.get("__last_active_mode")?.value ?? null;
    const url = new URL(request.url);
    const requestedUrl = sanitizeNextPath(url.searchParams.get("next")) ?? null;
    const redirectPath = getPostLoginRedirect(lastActiveMode, { hasCart: false, requestedUrl });
    const finalRedirect = goToOnboarding
      ? requestedUrl
        ? `/auth/onboarding?from=login&next=${encodeURIComponent(requestedUrl)}`
        : "/auth/onboarding?from=login"
      : redirectPath;

    const res = ok({ redirect: finalRedirect }, requestId);
    const isProduction = (process.env.NODE_ENV as string) === "production";
    res.cookies.set("__dev_user_id", userId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    });
    res.cookies.set("__dev_user", role, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    });
    return res;
  } catch (error) {
    logError("auth/dev-login/POST", error, { requestId, path: "/api/auth/dev-login", method: "POST" });
    if (process.env.NODE_ENV === "development") {
      console.error("DEV LOGIN ERROR:", error);
    }
    return fail("Dev login failed", { code: "DEV_LOGIN_ERROR", status: 500, requestId });
  }
}
