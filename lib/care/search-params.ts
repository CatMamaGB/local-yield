/**
 * Strict parsing of Care browse URL params. No throwing; invalid values fall back to defaults.
 */

import type { CareCategory } from "./categories";
import { VALID_CARE_CATEGORIES } from "./categories";
import { RADIUS_OPTIONS, type RadiusOption } from "@/lib/geo/constants";
import { SEARCH_KEYS } from "@/lib/search/keys";
import { parseNumberParam, parseStringParam } from "@/lib/search/parse";
import type { SearchParamsLike } from "@/lib/search/types";

export type CareRadius = RadiusOption;

const ZIP_REGEX = /^\d{5}$/;

export interface ParsedCareSearchParams {
  zip?: string;
  radius: CareRadius;
  category?: CareCategory;
}

export function parseCareSearchParams(
  searchParams: SearchParamsLike
): ParsedCareSearchParams {
  const zip = parseStringParam(searchParams, SEARCH_KEYS.ZIP, (v) =>
    ZIP_REGEX.test(v)
  );

  const radius = parseNumberParam(
    searchParams,
    SEARCH_KEYS.RADIUS,
    25,
    RADIUS_OPTIONS
  ) as CareRadius;

  const categoryRaw = searchParams.get(SEARCH_KEYS.CATEGORY)?.trim();
  const category: CareCategory | undefined =
    categoryRaw && VALID_CARE_CATEGORIES.has(categoryRaw)
      ? (categoryRaw as CareCategory)
      : undefined;

  return { zip, radius, category };
}
