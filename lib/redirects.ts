/**
 * Central redirect logic for post-auth and post-onboarding.
 * Routing uses lastActiveMode (cookie), not primaryMode, so multi-mode users land where they left off.
 *
 * lastActiveMode persistence: the cookie is set (1) on entry to each mode root layout
 * (app/market/layout.tsx → MARKET, app/care/layout.tsx → CARE, app/dashboard/layout.tsx → SELL)
 * and (2) when the user explicitly switches mode via Account → Switch mode (PATCH /api/auth/primary-mode).
 */

export type PrimaryMode = "MARKET" | "SELL" | "CARE";

/** Cookie name for last active mode (used for post-login redirect). Set on mode root entry and on PATCH primary-mode. */
export const LAST_ACTIVE_MODE_COOKIE = "__last_active_mode";

export interface UserForRedirect {
  primaryMode?: PrimaryMode | null;
  role: string;
  isProducer?: boolean;
  isCaregiver?: boolean;
  isHomesteadOwner?: boolean;
}

/** Safe internal paths allowed for next= redirect (no open redirect). Excludes /auth/* to avoid loops. */
const SAFE_REDIRECT_PREFIXES = ["/market", "/dashboard", "/care", "/admin"] as const;

function isSafeRedirect(path: string | null | undefined): boolean {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  if (trimmed.toLowerCase().startsWith("http:") || trimmed.toLowerCase().startsWith("https:")) return false;
  if (trimmed.startsWith("/auth")) return false;
  const normalized = trimmed.split("?")[0];
  return SAFE_REDIRECT_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix + "/"));
}

/**
 * Returns the path if it is a safe next= redirect target, otherwise null.
 * Use when building login/signup/onboarding URLs with next=.
 */
export function sanitizeNextPath(path: string | null | undefined): string | null {
  if (!path || !isSafeRedirect(path)) return null;
  return path.trim();
}

/**
 * Post-login redirect priority: requestedUrl (next=) → cart checkout → lastActiveMode → market.
 * requestedUrl must be a safe internal path (validated).
 */
export function getPostLoginRedirect(
  lastActiveMode: string | null | undefined,
  options: { hasCart?: boolean; requestedUrl?: string | null } = {}
): string {
  const { hasCart = false, requestedUrl } = options;
  if (requestedUrl && isSafeRedirect(requestedUrl)) return requestedUrl;
  if (hasCart) return "/market/checkout";
  if (lastActiveMode === "SELL") return "/dashboard";
  if (lastActiveMode === "CARE") return "/care";
  return "/market/browse";
}

/**
 * Legacy: returns path based on primaryMode/roles. Prefer getPostLoginRedirect(lastActiveMode, hasCart) for routing.
 * Kept for backward compat and for initial redirect when no lastActiveMode cookie exists yet.
 */
export function getPostOnboardingRedirect(user: UserForRedirect): string {
  if (user.primaryMode === "SELL") return "/dashboard";
  if (user.primaryMode === "CARE") return "/care";

  const isProducer =
    user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;
  if (isProducer) return "/dashboard";

  const isCare = user.isCaregiver === true || user.isHomesteadOwner === true;
  if (isCare) return "/care";

  return "/market/browse";
}
