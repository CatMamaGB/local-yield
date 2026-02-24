/**
 * Market browse search parameter parsing.
 * URL is source of truth: group, category, view, map, sort, zip, radius, q.
 * Default view: category present => products, else producers. If map=1 => view=producers.
 */

import { RADIUS_OPTIONS } from "@/lib/geo/constants";
import { SEARCH_KEYS } from "./keys";
import { parseNumberParam, parseStringParam } from "./parse";
import type { SearchParamsLike } from "./types";

const ZIP_REGEX = /^\d{5}$/;

export type MarketView = "products" | "producers";
export const MARKET_SORT_PRODUCTS = ["distance", "newest", "price_asc", "rating"] as const;
export const MARKET_SORT_PRODUCERS = ["distance", "most_items"] as const;
export type MarketSortProduct = (typeof MARKET_SORT_PRODUCTS)[number];
export type MarketSortProducer = (typeof MARKET_SORT_PRODUCERS)[number];

export interface ParsedMarketSearchParams {
  zip?: string;
  radius: number;
  q?: string;
  group?: string;
  category?: string;
  view: MarketView;
  map: boolean;
  sort: string;
}

function parseView(searchParams: SearchParamsLike, categoryPresent: boolean): MarketView {
  const mapVal = searchParams.get(SEARCH_KEYS.MAP);
  if (mapVal === "1") return "producers";
  const viewRaw = searchParams.get(SEARCH_KEYS.VIEW)?.toLowerCase();
  if (viewRaw === "products" || viewRaw === "producers") return viewRaw;
  return categoryPresent ? "products" : "producers";
}

export function parseMarketSearchParams(
  searchParams: SearchParamsLike
): ParsedMarketSearchParams {
  const zip = parseStringParam(searchParams, SEARCH_KEYS.ZIP, (v) =>
    ZIP_REGEX.test(v)
  );
  const radius = parseNumberParam(
    searchParams,
    SEARCH_KEYS.RADIUS,
    25,
    RADIUS_OPTIONS
  );
  const q = parseStringParam(searchParams, SEARCH_KEYS.QUERY);
  const group = parseStringParam(searchParams, SEARCH_KEYS.GROUP);
  const category = parseStringParam(searchParams, SEARCH_KEYS.CATEGORY);
  const categoryPresent = Boolean(category || group);
  const view = parseView(searchParams, categoryPresent);
  const map = searchParams.get(SEARCH_KEYS.MAP) === "1";
  const sortRaw = searchParams.get(SEARCH_KEYS.SORT)?.toLowerCase();
  const sort =
    sortRaw && ([...MARKET_SORT_PRODUCTS, ...MARKET_SORT_PRODUCERS] as readonly string[]).includes(sortRaw)
      ? sortRaw
      : "distance";

  return { zip, radius, q, group, category, view, map, sort };
}
