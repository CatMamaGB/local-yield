/**
 * GET /api/item-requests?zip=90210&radius=25 — list open requests in radius (for producers).
 * POST /api/item-requests — create request (buyer; body: description, zipCode, radiusMiles?).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createItemRequest, listItemRequestsByRadius } from "@/lib/item-requests";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip")?.trim().slice(0, 5) || null;
  const radius = Math.min(100, Math.max(1, Number(searchParams.get("radius")) || 25));
  if (!zip) {
    return Response.json({ error: "zip required" }, { status: 400 });
  }
  const list = await listItemRequestsByRadius(zip, radius);
  return Response.json({
    requests: list.map((r) => ({
      id: r.id,
      description: r.description,
      zipCode: r.zipCode,
      radiusMiles: r.radiusMiles,
      distance: r.distance,
      createdAt: r.createdAt.toISOString(),
      requesterName: r.requester.name ?? null,
    })),
    zip,
    radiusMiles: radius,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { description?: string; zipCode?: string; radiusMiles?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const description = body.description?.trim();
  const zipCode = (body.zipCode ?? user.zipCode).toString().trim().slice(0, 5);
  if (!description || description.length < 2) {
    return Response.json({ error: "description required (min 2 chars)" }, { status: 400 });
  }
  if (!zipCode || zipCode.length !== 5) {
    return Response.json({ error: "zipCode required (5 digits)" }, { status: 400 });
  }
  const radiusMiles = body.radiusMiles != null ? Math.min(100, Math.max(1, Number(body.radiusMiles))) : undefined;
  try {
    const created = await createItemRequest({
      requesterId: user.id,
      description,
      zipCode,
      radiusMiles,
    });
    return Response.json({
      id: created.id,
      description: created.description,
      zipCode: created.zipCode,
      radiusMiles: created.radiusMiles,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create request" },
      { status: 500 }
    );
  }
}
