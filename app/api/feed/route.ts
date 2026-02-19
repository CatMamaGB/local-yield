/**
 * GET /api/feed?zip=&radius=
 * Community feed: recent events, help exchange postings (OPEN), and new products in radius.
 */

import { NextRequest } from "next/server";
import { getFeed } from "@/lib/feed";
import { MAX_RADIUS_MILES } from "@/lib/geo/constants";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.DEFAULT, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const zip = request.nextUrl.searchParams.get("zip")?.trim().slice(0, 5) || null;
    const radius = Math.min(MAX_RADIUS_MILES, Math.max(1, Number(request.nextUrl.searchParams.get("radius")) || 25));

    const feed = await getFeed(zip, radius);
    return ok(feed, requestId);
  } catch (e) {
    logError("feed/GET", e, { requestId, path: "/api/feed", method: "GET" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
