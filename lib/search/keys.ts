/**
 * Standardized search parameter key constants.
 * Prevents drift (e.g., r, distance, miles, zipCode across routes).
 */

export const SEARCH_KEYS = {
  ZIP: "zip",
  RADIUS: "radius",
  QUERY: "q",
  SORT: "sort",
  CATEGORY: "category",
  GROUP: "group",
  VIEW: "view",
  MAP: "map",
  PAGE: "page",
} as const;
