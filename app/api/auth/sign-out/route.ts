/**
 * POST /api/auth/sign-out — clear dev cookies and redirect. When Clerk is configured, redirect to Clerk sign-out URL.
 */

import { NextRequest } from "next/server";
import { ok } from "@/lib/api";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.AUTH);
  if (rateLimitRes) return rateLimitRes;

  const res = ok(undefined);
  res.cookies.set("__dev_user", "", { path: "/", maxAge: 0 });
  res.cookies.set("__dev_user_id", "", { path: "/", maxAge: 0 });
  res.cookies.set("__dev_zip", "", { path: "/", maxAge: 0 });
  return res;
}
