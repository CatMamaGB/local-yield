/**
 * Feature flags for The Local Yield.
 * Fastest: env vars (NEXT_PUBLIC_* for client). Later: DB FeatureFlag table.
 */

/** Care experience (marketplace for caregivers). When false, Care is "coming soon" and /care/* sub-routes redirect to /care. */
export function isCareEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_CARE === "true";
}
