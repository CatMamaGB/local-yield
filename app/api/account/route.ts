/**
 * GET /api/account — current user account (name, contact, address). Any authenticated user.
 * PATCH /api/account — update name, phone, zipCode, address. Used by all roles (buyer, producer, care).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { AccountUpdateSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuth();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        zipCode: true,
        addressLine1: true,
        city: true,
        state: true,
      },
    });
    if (!dbUser) return fail("Not found", "NOT_FOUND", 404);
    return ok({
      name: dbUser.name ?? "",
      email: dbUser.email,
      phone: dbUser.phone,
      zipCode: dbUser.zipCode,
      addressLine1: dbUser.addressLine1 ?? "",
      city: dbUser.city ?? "",
      state: dbUser.state ?? "",
    });
  } catch (e) {
    logError("account/GET", e, { requestId, path: "/api/account", method: "GET" });
    const message = e instanceof Error ? e.message : "Unauthorized";
    return fail(message, "UNAUTHORIZED", 401);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireAuth();
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, "INVALID_JSON", 400);

    const parsed = AccountUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = first.name?.[0] ?? first.phone?.[0] ?? first.zipCode?.[0] ?? "Invalid fields";
      return fail(msg, "VALIDATION_ERROR", 400);
    }

    const { name, phone, zipCode, addressLine1, city, state } = parsed.data;
    const updateData: {
      name?: string | null;
      phone?: string;
      zipCode?: string;
      addressLine1?: string | null;
      city?: string | null;
      state?: string | null;
    } = {};
    if (name !== undefined) updateData.name = name.trim() || null;
    if (phone !== undefined) updateData.phone = phone.trim();
    if (zipCode !== undefined) {
      const z = zipCode.trim().slice(0, 5);
      if (/^\d{5}$/.test(z)) updateData.zipCode = z;
    }
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1?.trim() || null;
    if (city !== undefined) updateData.city = city?.trim() || null;
    if (state !== undefined) updateData.state = state?.trim() || null;

    if (Object.keys(updateData).length === 0) return ok(undefined);

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    return ok(undefined);
  } catch (e) {
    logError("account/PATCH", e, { requestId, path: "/api/account", method: "PATCH" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Unauthorized") return fail(message, "UNAUTHORIZED", 401);
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
