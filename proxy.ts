/**
 * Proxy: staging/preview gate (Basic Auth or preview cookie) + Clerk auth.
 * - PREVIEW_MODE=true: public landing + private preview (cookie); no Basic Auth.
 * - PREVIEW_MODE=false + APP_GATE_ENABLED=true: Basic Auth.
 * - Clerk: protect dashboard/API when configured.
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { verifyPreviewSessionEdge } from "@/lib/preview-session-edge";

const PREVIEW_PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/terms",
  "/privacy",
  "/community-guidelines",
  "/seller-guidelines",
  "/care-safety",
  "/preview",
  "/api/preview/enter",
]);

function isPublicPreviewPath(pathname: string): boolean {
  if (PREVIEW_PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml")
    return true;
  return false;
}

function isPageRoute(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next/")) return false;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml")
    return false;
  return true;
}

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
  const previewMode = process.env.PREVIEW_MODE === "true";

  if (previewMode) {
    const pathname = req.nextUrl.pathname;
    if (isPublicPreviewPath(pathname)) {
      return runClerk(req, event);
    }

    const cookieSecret = process.env.PREVIEW_COOKIE_SECRET ?? "";
    const cookie = req.cookies.get("preview_session")?.value;
    const payload = await verifyPreviewSessionEdge(cookie, cookieSecret);

    if (!payload) {
      const next = encodeURIComponent(pathname);
      const url = new URL("/preview", req.url);
      url.searchParams.set("next", next);
      return NextResponse.redirect(url);
    }

    if (req.method === "GET" && isPageRoute(pathname)) {
      const origin = req.nextUrl.origin;
      fetch(`${origin}/api/preview/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ path: pathname }),
      }).catch(() => {});
    }

    return runClerk(req, event);
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

  return runClerk(req, event);
}

async function runClerk(req: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }
  return withClerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?|manifest.json)).*)",
    "/(api|trpc)(.*)",
  ],
};
