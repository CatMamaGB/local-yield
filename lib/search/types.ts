/**
 * Shared types for search parameter parsing.
 */

/** Accepts URLSearchParams or Next.js useSearchParams() return (has .get). */
export interface SearchParamsLike {
  get(name: string): string | null;
}
