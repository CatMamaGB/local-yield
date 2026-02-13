/**
 * GET /api/item-requests?zip=90210&radius=25 — list open requests in radius (for producers).
 * POST /api/item-requests — create request (buyer; body: description, zipCode, radiusMiles?).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createItemRequest, listItemRequestsByRadius } from "@/lib/item-requests";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const { searchParams } = new URL(request.url);
    const zip = searchParams.get("zip")?.trim().slice(0, 5) || null;
    const radius = Math.min(100, Math.max(1, Number(searchParams.get("radius")) || 25));
    if (!zip) return fail("zip required", "VALIDATION_ERROR", 400);
    const list = await listItemRequestsByRadius(zip, radius);
    return ok({
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
  } catch (e) {
    logError("item-requests/GET", e, { requestId, path: "/api/item-requests", method: "GET" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const user = await getCurrentUser();
  if (!user) return fail("Unauthorized", "UNAUTHORIZED", 401);

  const { data: body, error: parseError } = await parseJsonBody(request);
  if (parseError) return fail(parseError, "INVALID_JSON", 400);

  const description = body?.description?.trim();
  const zipCode = (body?.zipCode ?? user.zipCode).toString().trim().slice(0, 5);
  if (!description || description.length < 2) return fail("description required (min 2 chars)", "VALIDATION_ERROR", 400);
  if (!zipCode || zipCode.length !== 5) return fail("zipCode required (5 digits)", "VALIDATION_ERROR", 400);
  const radiusMiles = body?.radiusMiles != null ? Math.min(100, Math.max(1, Number(body.radiusMiles))) : undefined;

  try {
    const created = await createItemRequest({
      requesterId: user.id,
      description,
      zipCode,
      radiusMiles,
    });
    return ok({
      id: created.id,
      description: created.description,
      zipCode: created.zipCode,
      radiusMiles: created.radiusMiles,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (e) {
    logError("item-requests/POST", e, { requestId, path: "/api/item-requests", method: "POST" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
