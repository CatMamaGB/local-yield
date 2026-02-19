/**
 * Generic parsing utilities for search parameters.
 */

import type { SearchParamsLike } from "./types";

/**
 * Parse a number from search params with validation against allowed values.
 */
export function parseNumberParam(
  searchParams: SearchParamsLike,
  key: string,
  defaultValue: number,
  allowedValues?: readonly number[]
): number {
  const raw = searchParams.get(key);
  if (!raw) return defaultValue;
  const num = parseInt(raw, 10);
  if (isNaN(num)) return defaultValue;
  if (allowedValues && !allowedValues.includes(num)) return defaultValue;
  return num;
}

/**
 * Parse a string from search params with optional validation.
 */
export function parseStringParam(
  searchParams: SearchParamsLike,
  key: string,
  validator?: (value: string) => boolean
): string | undefined {
  const raw = searchParams.get(key)?.trim();
  if (!raw) return undefined;
  if (validator && !validator(raw)) return undefined;
  return raw;
}
