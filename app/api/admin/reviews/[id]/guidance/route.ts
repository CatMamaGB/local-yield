/**
 * PATCH /api/admin/reviews/[id]/guidance — Admin: set guidance text for producer/buyer.
 * Body: { guidance: string | null }
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setAdminGuidance } from "@/lib/reviews";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return Response.json({ error: "Missing review id" }, { status: 400 });
  let body: { guidance?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const guidance = body.guidance === undefined ? null : (body.guidance ?? null);
  try {
    await setAdminGuidance(id, typeof guidance === "string" ? guidance : null);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to set guidance" },
      { status: 500 }
    );
  }
}
