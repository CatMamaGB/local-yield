/**
 * GET /api/products/[id] — get one product (public for shop; ownership for edit).
 * PATCH /api/products/[id] — update (producer owner or admin).
 * DELETE /api/products/[id] — delete (producer owner or admin).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, zipCode: true } } },
  });
  if (!product) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ product });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { product, error } = await getProductAndCheckOwnership(id);
  if (error) {
    return Response.json({ error }, { status: error === "Not found" ? 404 : 403 });
  }
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.price !== undefined) {
    const p = Number(body.price);
    if (!Number.isNaN(p) && p >= 0) updates.price = p;
  }
  if (body.category !== undefined) updates.category = String(body.category).trim() || "Other";
  if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
  if (body.delivery !== undefined) updates.delivery = Boolean(body.delivery);
  if (body.pickup !== undefined) updates.pickup = Boolean(body.pickup);
  if (body.quantityAvailable !== undefined) {
    const q = body.quantityAvailable === null ? null : Number(body.quantityAvailable);
    updates.quantityAvailable = q != null && Number.isInteger(q) && q >= 0 ? q : null;
  }
  const updated = await prisma.product.update({
    where: { id },
    data: updates as Parameters<typeof prisma.product.update>[0]["data"],
  });
  return Response.json({ product: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getProductAndCheckOwnership(id);
  if (error) {
    return Response.json({ error }, { status: error === "Not found" ? 404 : 403 });
  }
  await prisma.product.delete({ where: { id } });
  return Response.json({ ok: true });
}
