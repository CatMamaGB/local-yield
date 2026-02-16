/**
 * POST /api/preview/log — Record a page view for the current preview viewer (called by middleware).
 * Requires valid preview_session cookie. Throttles: at most one log per viewerId+path per minute.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPreviewSession, hashIp } from "@/lib/preview-session";
import { parseJsonBody, fail } from "@/lib/api";

const THROTTLE_MS = 60 * 1000; // 1 minute

export async function POST(request: NextRequest) {
  const cookieSecret = process.env.PREVIEW_COOKIE_SECRET ?? "";
  if (!cookieSecret) return NextResponse.json({ ok: false }, { status: 503 });

  const cookie = request.cookies.get("preview_session")?.value;
  const payload = verifyPreviewSession(cookie, cookieSecret);
  if (!payload) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: body, error: parseError } = await parseJsonBody<{ path?: string }>(request);
  if (parseError || !body?.path || typeof body.path !== "string") {
    return fail("path is required", "VALIDATION_ERROR", 400);
  }
  const path = body.path.trim();
  if (!path.startsWith("/")) return fail("path must start with /", "VALIDATION_ERROR", 400);

  const userAgent = request.headers.get("user-agent") ?? undefined;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : undefined;
  const ipHash = hashIp(ip, cookieSecret);

  // Throttle: skip if we already logged this viewerId+path in the last minute
  const since = new Date(Date.now() - THROTTLE_MS);
  const recent = await prisma.previewAccessLog.findFirst({
    where: {
      viewerId: payload.viewerId,
      path,
      createdAt: { gte: since },
    },
  });
  if (recent) return new NextResponse(null, { status: 204 });

  await prisma.previewAccessLog.create({
    data: {
      viewerId: payload.viewerId,
      path,
      userAgent,
      ipHash,
    },
  });
  return new NextResponse(null, { status: 204 });
}
