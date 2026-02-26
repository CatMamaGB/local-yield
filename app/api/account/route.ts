/**
 * GET /api/account — current user account (name, contact, address). Any authenticated user.
 * PATCH /api/account — update name, phone, zipCode, address. Used by all roles (buyer, producer, care).
 */

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
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
    });
    if (!dbUser) return fail("Not found", { code: "NOT_FOUND", status: 404 });
    return ok({
      name: dbUser.name ?? "",
      email: dbUser.email,
      phone: dbUser.phone,
      zipCode: dbUser.zipCode ?? null,
      addressLine1: dbUser.addressLine1 ?? "",
      city: dbUser.city ?? "",
      state: dbUser.state ?? "",
      allowProducerExport: (dbUser as { allowProducerExport?: boolean }).allowProducerExport ?? true,
    });
  } catch (e) {
    logError("account/GET", e, { requestId, path: "/api/account", method: "GET" });
    return mapAuthErrorToResponse(e, requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireAuth();
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const parsed = AccountUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = first.name?.[0] ?? first.phone?.[0] ?? first.zipCode?.[0] ?? "Invalid fields";
      return fail(msg, { code: "VALIDATION_ERROR", status: 400 });
    }

    const { name, phone, zipCode, addressLine1, city, state, allowProducerExport } = parsed.data;
    const updateData: Prisma.UserUpdateInput = {};
    if (name !== undefined) updateData.name = name.trim() || null;
    if (phone !== undefined) updateData.phone = phone.trim();
    if (zipCode !== undefined) {
      const z = (zipCode ?? "").toString().trim().slice(0, 5);
      (updateData as Record<string, unknown>).zipCode = /^\d{5}$/.test(z) ? z : { set: null };
    }
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1?.trim() || null;
    if (city !== undefined) updateData.city = city?.trim() || null;
    if (state !== undefined) updateData.state = state?.trim() || null;
    if (allowProducerExport !== undefined) (updateData as Record<string, unknown>).allowProducerExport = allowProducerExport;

    if (Object.keys(updateData).length === 0) return ok(undefined);

    await prisma.user.update({
      where: { id: user.id },
      data: updateData as Prisma.UserUpdateInput,
    });
    return ok(undefined);
  } catch (e) {
    logError("account/PATCH", e, { requestId, path: "/api/account", method: "PATCH" });
    return mapAuthErrorToResponse(e, requestId);
  }
}
