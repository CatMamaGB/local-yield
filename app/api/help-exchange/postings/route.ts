/**
 * GET /api/help-exchange/postings?zip&radius
 * POST /api/help-exchange/postings
 * 
 * Help Exchange postings: list (public) and create (auth required).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireCapability } from "@/lib/authz";
import {
  createHelpExchangePosting,
  listHelpExchangePostingsByRadius,
  listHelpExchangePostingsByCreator,
} from "@/lib/help-exchange";
import { CreateHelpExchangePostingSchema } from "@/lib/validators";
import { ok, fail, parseJsonBody, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { ZipSchema } from "@/lib/validators";
import { RADIUS_OPTIONS } from "@/lib/geo/constants";

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.DEFAULT, requestId);
  if (rateLimitRes) return rateLimitRes;
  try {
    const searchParams = request.nextUrl.searchParams;
    const mine = searchParams.get("mine") === "1" || searchParams.get("mine") === "true";

    if (mine) {
      const user = await getCurrentUser();
      if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
      const postings = await listHelpExchangePostingsByCreator(user.id);
      return ok({
        postings: postings.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          zipCode: p.zipCode,
          radiusMiles: p.radiusMiles,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          createdBy: p.createdBy,
        })),
      }, requestId);
    }

    const zip = searchParams.get("zip")?.trim();
    const radiusStr = searchParams.get("radius");

    if (!zip) {
      return fail("ZIP code is required (or use mine=1 for your postings)", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const zipResult = ZipSchema.safeParse(zip);
    if (!zipResult.success) {
      return fail("Invalid ZIP code", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const radius = radiusStr ? parseInt(radiusStr, 10) : 25;
    if (isNaN(radius) || !(RADIUS_OPTIONS as readonly number[]).includes(radius)) {
      return fail(`Radius must be one of: ${RADIUS_OPTIONS.join(", ")}`, {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const postings = await listHelpExchangePostingsByRadius(
      zipResult.data,
      radius
    );

    return ok({ postings }, requestId);
  } catch (error) {
    logError("help-exchange/postings/GET", error, {
      requestId,
      path: "/api/help-exchange/postings",
      method: "GET",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}

export async function POST(request: NextRequest) {
  const requestId = withRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const authz = await requireCapability("canPostCareJob");
    if (!authz.ok) return authz.response;

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });
    }

    const validation = CreateHelpExchangePostingSchema.safeParse(body);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid request", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const posting = await createHelpExchangePosting({
      createdById: authz.user.id,
      title: validation.data.title,
      description: validation.data.description,
      category: validation.data.category,
      zipCode: validation.data.zipCode,
      radiusMiles: validation.data.radiusMiles,
    });

    return ok({ posting }, requestId);
  } catch (error) {
    logError("help-exchange/postings/POST", error, {
      requestId,
      path: "/api/help-exchange/postings",
      method: "POST",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
