/**
 * POST /api/admin/reviews/[id]/dismiss-flag — Admin: dismiss producer's flag (review stays as-is).
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { dismissFlagByAdmin } from "@/lib/reviews";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return Response.json({ error: "Missing review id" }, { status: 400 });
  try {
    await dismissFlagByAdmin(id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to dismiss flag" },
      { status: 500 }
    );
  }
}
