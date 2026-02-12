/**
 * Central redirect logic for post-auth and post-onboarding.
 * Primary mode decides first landing; fallback by roles if primaryMode missing.
 */

export type PrimaryMode = "MARKET" | "SELL" | "CARE";

export interface UserForRedirect {
  primaryMode?: PrimaryMode | null;
  role: string;
  isProducer?: boolean;
  isCaregiver?: boolean;
  isHomesteadOwner?: boolean;
}

/**
 * Returns the canonical redirect path after login/onboarding.
 * - If primaryMode === "SELL" → /dashboard
 * - If primaryMode === "CARE" → /care
 * - Else (MARKET or missing) → /market (market browse)
 * Fallback when primaryMode is missing:
 * - If roles include PRODUCER → /dashboard
 * - Else if roles include CAREGIVER or CARE_SEEKER → /care
 * - Else → /market
 */
export function getPostOnboardingRedirect(user: UserForRedirect): string {
  if (user.primaryMode === "SELL") return "/dashboard";
  if (user.primaryMode === "CARE") return "/care";

  // MARKET or null: use role fallback
  const isProducer =
    user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;
  if (isProducer) return "/dashboard";

  const isCare = user.isCaregiver === true || user.isHomesteadOwner === true;
  if (isCare) return "/care";

  return "/market";
}
