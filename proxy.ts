/**
 * Proxy: admin 403 (dev) + lastActiveMode cookie + staging gate (Basic Auth) + Clerk auth.
 * - /admin/* in dev: 403 for non-admins (__dev_user !== "ADMIN").
 * - In production, /admin is protected by admin layout (redirect to /admin/forbidden for non-admins).
 * - /market, /care, /dashboard: set __last_active_mode cookie.
 * - APP_GATE_ENABLED=true: Basic Auth for staging.
 * - Clerk: protect dashboard/API when configured.
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const LAST_ACTIVE_MODE_COOKIE = "__last_active_mode";

function withLastActiveModeCookie(res: NextResponse, pathname: string): NextResponse {
  let value: string | null = null;
  if (pathname.startsWith("/market")) value = "MARKET";
  else if (pathname.startsWith("/care")) value = "CARE";
  else if (pathname.startsWith("/dashboard")) value = "SELL";
  if (value) {
    res.cookies.set(LAST_ACTIVE_MODE_COOKIE, value, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}

const ADMIN_FORBIDDEN_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Access denied</title></head>
<body style="font-family:system-ui;max-width:28rem;margin:4rem auto;padding:2rem;text-align:center;">
  <h1 style="font-size:1.5rem;">You don't have access to Admin</h1>
  <p style="color:#666;">Admin is only available to users with admin permissions.</p>
  <a href="/dashboard" style="display:inline-block;margin-top:1.5rem;padding:0.5rem 1.25rem;background:#5D4524;color:white;text-decoration:none;border-radius:0.5rem;">Back to dashboard</a>
</body></html>`;

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Staging"' },
  });
}

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/market/checkout(.*)",
  "/api/dashboard(.*)",
  "/api/orders(.*)",
  "/api/products(.*)",
]);

const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && process.env.NODE_ENV === "development") {
    const devUser = req.cookies.get("__dev_user")?.value;
    if (devUser !== "ADMIN") {
      return new NextResponse(ADMIN_FORBIDDEN_HTML, {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  const gateEnabled = process.env.APP_GATE_ENABLED === "true";
  if (gateEnabled) {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Basic ")) return unauthorized();

    const base64 = auth.slice("Basic ".length);
    let decoded = "";
    try {
      decoded = atob(base64);
    } catch {
      return unauthorized();
    }

    const [user, pass] = decoded.split(":");
    const expectedUser = process.env.APP_GATE_USER ?? "";
    const expectedPass = process.env.APP_GATE_PASS ?? "";

    if (user !== expectedUser || pass !== expectedPass) return unauthorized();
  }

  const res = await runClerk(req, event);
  if (res instanceof NextResponse) {
    return withLastActiveModeCookie(res, pathname);
  }
  return res;
}

async function runClerk(req: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }
  return withClerk(req, event);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?|manifest.json)).*)",
    "/(api|trpc)(.*)",
  ],
};
