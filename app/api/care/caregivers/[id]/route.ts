/**
 * GET /api/care/caregivers/[id]
 * Returns caregiver profile with service listings and public CARE reviews.
 */

import { NextRequest } from "next/server";
import { getCaregiverProfile } from "@/lib/care";
import { ok, fail } from "@/lib/api";
import { getRequestId } from "@/lib/request-id";
import { logError } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const { id } = await params;
    if (!id) return fail("Caregiver ID required", "VALIDATION_ERROR", 400);

    const profile = await getCaregiverProfile(id);
    if (!profile) return fail("Caregiver not found", "NOT_FOUND", 404);

    return ok({ caregiver: profile });
  } catch (error) {
    logError("care/caregivers/[id]/GET", error, { requestId, path: "/api/care/caregivers/[id]", method: "GET" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
