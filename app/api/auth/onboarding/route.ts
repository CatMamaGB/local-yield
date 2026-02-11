/**
 * POST /api/auth/onboarding — development-only. Sets __dev_zip cookie and returns redirect.
 * Body: { zipCode: string }. Redirect based on __dev_user cookie (PRODUCER -> dashboard, else -> market).
 */

import { NextRequest, NextResponse } from "next/server";

const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const zipRaw = String(body.zipCode ?? "").trim();
  const zip = zipRaw.slice(0, 5);
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Valid 5-digit ZIP required" }, { status: 400 });
  }
  const devUser = request.cookies.get("__dev_user")?.value;
  const redirect =
    devUser === "PRODUCER" ? "/dashboard" : "/market/browse";
  const res = NextResponse.json({
    ok: true,
    redirect,
  });
  res.cookies.set("__dev_zip", zip, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
    secure: false, // dev-only
  });
  return res;
}
