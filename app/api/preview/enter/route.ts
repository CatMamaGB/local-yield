/**
 * POST /api/preview/enter — Verify passphrase, upsert viewer, create access log, set preview_session cookie.
 * Used when PREVIEW_MODE=true. Public route (allowed by middleware without cookie).
 */

import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signPreviewSession, hashIp } from "@/lib/preview-session";
import { parseJsonBody, fail } from "@/lib/api";

const COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days

/** Constant-time passphrase comparison. */
function passphraseMatches(given: string, expected: string): boolean {
  const secret = process.env.PREVIEW_COOKIE_SECRET ?? "";
  const a = createHmac("sha256", secret).update(given).digest();
  const b = createHmac("sha256", secret).update(expected).digest();
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const { data: body, error: parseError } = await parseJsonBody<{
    name?: string;
    email?: string;
    passphrase?: string;
    next?: string;
  }>(request);
  if (parseError) return fail(parseError, "INVALID_JSON", 400);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const passphrase = typeof body?.passphrase === "string" ? body.passphrase : "";
  const nextPath = typeof body?.next === "string" ? body.next.trim() : "";

  if (!name) return fail("Name is required", "VALIDATION_ERROR", 400);
  if (!email) return fail("Email is required", "VALIDATION_ERROR", 400);
  if (!passphrase) return fail("Passphrase is required", "VALIDATION_ERROR", 400);

  const expectedPasscode = process.env.PREVIEW_PASSCODE ?? "";
  if (!expectedPasscode) return fail("Preview access is not configured", "CONFIG_ERROR", 503);
  if (!passphraseMatches(passphrase, expectedPasscode)) {
    return fail("Invalid passphrase", "INVALID_PASSPHRASE", 401);
  }

  const cookieSecret = process.env.PREVIEW_COOKIE_SECRET ?? "";
  if (!cookieSecret) return fail("Preview session is not configured", "CONFIG_ERROR", 503);

  const userAgent = request.headers.get("user-agent") ?? undefined;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : undefined;

  const viewer = await prisma.previewViewer.upsert({
    where: { email },
    create: { name, email },
    update: { name },
  });

  await prisma.previewAccessLog.create({
    data: {
      viewerId: viewer.id,
      path: "/preview-enter",
      userAgent,
      ipHash: hashIp(ip, cookieSecret),
    },
  });

  const payload = { viewerId: viewer.id, issuedAt: Date.now() };
  const signed = signPreviewSession(payload, cookieSecret);

  const redirectTo = safeRedirectPath(nextPath) ? nextPath : "/market";
  const response = NextResponse.json({ ok: true, redirect: redirectTo });
  response.cookies.set("preview_session", signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
  return response;
}

/** Allow only same-origin pathnames (no // or protocol). */
function safeRedirectPath(next: string): boolean {
  if (!next || next.startsWith("//") || next.includes(":")) return false;
  if (!next.startsWith("/")) return false;
  return true;
}
