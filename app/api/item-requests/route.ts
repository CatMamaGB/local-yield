/**
 * GET /api/item-requests?zip=90210&radius=25 — list open requests in radius (for producers).
 * POST /api/item-requests — create request (buyer; body: description, zipCode, radiusMiles?).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { MAX_RADIUS_MILES } from "@/lib/geo/constants";
import { createItemRequest, listItemRequestsByRadius } from "@/lib/item-requests";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { ItemRequestsQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      zip: searchParams.get("zip") || undefined,
      radius: searchParams.get("radius") || undefined,
    };
    
    const validation = ItemRequestsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid query parameters", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }
    
    const zip = validation.data.zip;
    const radius = validation.data.radius ?? 25;
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
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  const user = await getCurrentUser();
  if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });

  const { data: body, error: parseError } = await parseJsonBody(request);
  if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

  const description = body?.description?.trim();
  const zipCode = (body?.zipCode ?? user.zipCode).toString().trim().slice(0, 5);
  if (!description || description.length < 2) return fail("description required (min 2 chars)", { code: "VALIDATION_ERROR", status: 400 });
  if (!zipCode || zipCode.length !== 5) return fail("zipCode required (5 digits)", { code: "VALIDATION_ERROR", status: 400 });
  const radiusMiles = body?.radiusMiles != null ? Math.min(MAX_RADIUS_MILES, Math.max(1, Number(body.radiusMiles))) : undefined;

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
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
