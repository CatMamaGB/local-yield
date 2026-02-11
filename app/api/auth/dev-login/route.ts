/**
 * POST /api/auth/dev-login — development-only. Sets __dev_user cookie and returns redirect.
 * Body: { role: "BUYER" | "PRODUCER" | "ADMIN" }
 */

import { NextRequest, NextResponse } from "next/server";

const VALID_ROLES = ["BUYER", "PRODUCER", "ADMIN"] as const;

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const role = body.role;
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const res = NextResponse.json({
    ok: true,
    redirect: "/auth/onboarding",
  });
  res.cookies.set("__dev_user", role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    sameSite: "lax",
    secure: false, // dev-only route; production should use Clerk
  });
  return res;
}
