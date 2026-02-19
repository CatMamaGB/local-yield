/**
 * ZIP code validation and normalization utilities.
 * Standardized for use across API routes, forms, and search params.
 */

const ZIP_REGEX = /^\d{5}$/;

/**
 * Validate a ZIP code (5 digits only).
 */
export function validateZip(zip: string): boolean {
  return ZIP_REGEX.test(String(zip).trim());
}

/**
 * Normalize ZIP to 5-digit string for lookup.
 * Returns null if invalid.
 */
export function normalizeZip(zip: string): string | null {
  const s = String(zip).trim().slice(0, 5);
  return s.length === 5 ? s : null;
}
