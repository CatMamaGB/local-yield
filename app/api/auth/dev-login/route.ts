/**
 * POST /api/auth/dev-login — development-only. Sets __dev_user cookie and upserts stub user in DB.
 * Body: { role: "BUYER" | "PRODUCER" | "ADMIN" }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { logError } from "@/lib/logger";
import { PlatformUse, Role, PrimaryMode } from "@prisma/client";

const VALID_ROLES = ["BUYER", "PRODUCER", "ADMIN"] as const;
type DevRole = (typeof VALID_ROLES)[number];

const DEV_TO_PRISMA_ROLE: Record<DevRole, Role> = {
  BUYER: Role.BUYER,
  PRODUCER: Role.PRODUCER,
  ADMIN: Role.ADMIN,
};

// Stub user IDs matching lib/auth.ts
const STUB_USER_IDS: Record<string, string> = {
  BUYER: "stub-buyer-1",
  PRODUCER: "stub-producer-1",
  ADMIN: "stub-admin-1",
};

const STUB_EMAILS: Record<string, string> = {
  BUYER: "buyer@test.localyield.example",
  PRODUCER: "producer@test.localyield.example",
  ADMIN: "admin@test.localyield.example",
};

const STUB_NAMES: Record<string, string> = {
  BUYER: "Test Buyer",
  PRODUCER: "Test Producer",
  ADMIN: "Test Admin",
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return fail("Not available", "NOT_AVAILABLE", 404);
  }

  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.AUTH);
  if (rateLimitRes) return rateLimitRes;

  try {
    // Parse and validate request body
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return fail(parseError, "INVALID_JSON", 400);
    }

    const role = body.role;
    if (!VALID_ROLES.includes(role)) {
      return fail("Invalid role", "INVALID_ROLE", 400);
    }

    const userId = STUB_USER_IDS[role];
    const email = STUB_EMAILS[role];
    const name = STUB_NAMES[role];
    const primaryMode = role === "BUYER" ? PrimaryMode.MARKET : PrimaryMode.SELL;
    const platformUse = role === "BUYER" ? PlatformUse.BUY_LOCAL_GOODS : PlatformUse.SELL_PRODUCTS;
    const prismaRole = DEV_TO_PRISMA_ROLE[role as DevRole];

    // Upsert stub user in database and keep role rows in sync.
    await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email,
          name,
          phone: "",
          zipCode: "90210", // Default ZIP for stub users
          role,
          primaryMode,
          platformUse,
          isBuyer: role === "BUYER",
          isProducer: role === "PRODUCER" || role === "ADMIN",
          isCaregiver: false,
          isHomesteadOwner: false,
        },
        update: {
          email,
          name,
          role,
          primaryMode,
          platformUse,
          isBuyer: role === "BUYER",
          isProducer: role === "PRODUCER" || role === "ADMIN",
          isCaregiver: false,
          isHomesteadOwner: false,
        },
      });

      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.create({
        data: {
          userId,
          role: prismaRole,
        },
      });
    });

    const res = ok({ redirect: "/auth/onboarding" });
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
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
