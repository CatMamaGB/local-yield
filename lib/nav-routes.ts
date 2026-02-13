/**
 * Nav route rules: when to hide chrome, and derived nav context.
 * Single place for route-based nav behavior so Navbar and wrappers stay in sync.
 */

import type { SessionUser } from "./auth";
import { getUserCapabilities } from "./authz";

/** Routes where we hide main Navbar and Footer (minimal chrome). */
export const HIDE_CHROME_ROUTES = [
  "/auth",
  "/invite",
  "/reset-password",
] as const;

export function shouldHideChrome(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDE_CHROME_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

/** Whether we're in an "app" area (dashboard or admin) — Navbar shows minimal: logo + mode switcher + account only. Strict: exact path or prefix with slash. */
export function isAppArea(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

export type NavContext =
  | "public"
  | "dashboard-producer"
  | "dashboard-buyer"
  | "admin"
  | "auth";

/** Single derived nav context from pathname + user. Use for Navbar and any nav decisions. Strict path checks. */
export function getNavContext(
  pathname: string | null,
  user: SessionUser | null
): NavContext {
  if (!pathname) return "public";
  if (pathname.startsWith("/auth")) return "auth";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const caps = getUserCapabilities(user);
    return caps.canSell ? "dashboard-producer" : "dashboard-buyer";
  }
  return "public";
}
