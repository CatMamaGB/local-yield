/**
 * Shared utilities for The Local Yield.
 */

/** Merge class names; filters falsy values. */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

/** Format price for display. */
export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/** Format date for display. */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Validate US ZIP (5 or 5+4). */
export function isValidZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
}

/** Rough distance between two ZIPs (simplified; use a real geo API for production). */
export function zipRadiusMiles(zipA: string, zipB: string): number {
  // Stub: real impl would use lat/lng lookup and Haversine
  if (zipA.slice(0, 5) === zipB.slice(0, 5)) return 0;
  return 999;
}
