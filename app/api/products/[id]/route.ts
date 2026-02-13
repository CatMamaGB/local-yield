/**
 * GET /api/products/[id] — get one product (public for shop; ownership for edit).
 * PATCH /api/products/[id] — update (producer owner or admin).
 * DELETE /api/products/[id] — delete (producer owner or admin).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

async function getProductAndCheckOwnership(id: string, requireAuth = true) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { product: null, error: "Not found" as const };
  if (!requireAuth) return { product, error: null };
  const user = await requireProducerOrAdmin().catch(() => null);
  if (!user) return { product: null, error: "Forbidden" as const };
  if (product.userId !== user.id && user.role !== "ADMIN") {
    return { product: null, error: "Forbidden" as const };
  }
  return { product, error: null };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, zipCode: true } } },
    });
    if (!product) return fail("Not found", "NOT_FOUND", 404);
    return ok({ product });
  } catch (error) {
    logError("products/[id]/GET", error, { requestId, path: "/api/products/[id]", method: "GET" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { id } = await params;
    const { product, error } = await getProductAndCheckOwnership(id);
    if (error) return fail(error, error === "Not found" ? "NOT_FOUND" : "FORBIDDEN", error === "Not found" ? 404 : 403);

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, "INVALID_JSON", 400);

    const updates: Record<string, unknown> = {};
    if (body?.title !== undefined) updates.title = String(body.title).trim();
    if (body?.description !== undefined) updates.description = String(body.description).trim();
    if (body?.price !== undefined) {
      const p = Number(body.price);
      if (!Number.isNaN(p) && p >= 0) updates.price = p;
    }
    if (body?.category !== undefined) updates.category = String(body.category).trim() || "Other";
    if (body?.imageUrl !== undefined) updates.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    if (body?.delivery !== undefined) updates.delivery = Boolean(body.delivery);
    if (body?.pickup !== undefined) updates.pickup = Boolean(body.pickup);
    if (body?.quantityAvailable !== undefined) {
      const q = body.quantityAvailable === null ? null : Number(body.quantityAvailable);
      updates.quantityAvailable = q != null && Number.isInteger(q) && q >= 0 ? q : null;
    }
    const updated = await prisma.product.update({
      where: { id },
      data: updates as Parameters<typeof prisma.product.update>[0]["data"],
    });
    return ok({ product: updated });
  } catch (error) {
    logError("products/[id]/PATCH", error, { requestId, path: "/api/products/[id]", method: "PATCH" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { id } = await params;
    const { error } = await getProductAndCheckOwnership(id);
    if (error) return fail(error, error === "Not found" ? "NOT_FOUND" : "FORBIDDEN", error === "Not found" ? 404 : 403);
    await prisma.product.delete({ where: { id } });
    return ok(undefined);
  } catch (error) {
    logError("products/[id]/DELETE", error, { requestId, path: "/api/products/[id]", method: "DELETE" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
