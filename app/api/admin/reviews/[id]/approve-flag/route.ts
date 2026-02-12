/**
 * POST /api/admin/reviews/[id]/approve-flag — Admin: approve flagged review (clear flag, make public).
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { approveFlaggedReviewByAdmin } from "@/lib/reviews";

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
    await approveFlaggedReviewByAdmin(id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to approve review" },
      { status: 500 }
    );
  }
}
