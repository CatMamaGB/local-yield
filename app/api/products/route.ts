/**
 * GET /api/products — list products for current producer.
 * POST /api/products — create product (producer only). Body: title, price, description?, category?, imageUrl?, delivery, pickup, quantityAvailable?
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireProducerOrAdmin();
    const products = await prisma.product.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ products });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Forbidden";
    return Response.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireProducerOrAdmin();
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const price = Number(body.price);
    if (!title || Number.isNaN(price) || price < 0) {
      return Response.json({ error: "title and valid price required" }, { status: 400 });
    }
    const description = String(body.description ?? "").trim() || "No description.";
    const category = String(body.category ?? "Other").trim() || "Other";
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    const delivery = Boolean(body.delivery);
    const pickup = Boolean(body.pickup);
    const quantityAvailable = body.quantityAvailable != null ? Number(body.quantityAvailable) : null;

    const product = await prisma.product.create({
      data: {
        userId: user.id,
        title,
        description,
        price,
        imageUrl: imageUrl || null,
        category,
        delivery,
        pickup,
        quantityAvailable: quantityAvailable != null && Number.isInteger(quantityAvailable) && quantityAvailable >= 0 ? quantityAvailable : null,
      },
    });
    return Response.json({ product });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create product";
    return Response.json({ error: message }, { status: e instanceof Error && e.message === "Forbidden" ? 403 : 400 });
  }
}
