/**
 * URL building utilities for canonical search URLs.
 */

import { SEARCH_KEYS } from "./keys";

/**
 * Build a canonical search URL with normalized parameters.
 * Removes undefined values, sorts keys for consistency.
 */
export function buildSearchUrl(
  route: string,
  params: Record<string, string | number | undefined>
): string {
  const urlParams = new URLSearchParams();
  const sortedKeys = Object.keys(params).sort();

  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      urlParams.append(key, String(value));
    }
  }

  const queryString = urlParams.toString();
  return queryString ? `${route}?${queryString}` : route;
}
