/**
 * Feature flags for The Local Yield.
 * Fastest: env vars (NEXT_PUBLIC_* for client). Later: DB FeatureFlag table.
 */

/** Care experience (marketplace for caregivers). Always on; kept for API compatibility. */
export function isCareEnabled(): boolean {
  return true;
}
