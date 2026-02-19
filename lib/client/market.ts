/**
 * Market API client wrappers.
 * Convenience functions for market-related API calls with standardized error handling.
 */

import { apiGet } from "./api-client";
import type { ListingsBrowseResponse } from "@/lib/market/types";

export interface SearchListingsParams {
  zip?: string;
  radius?: number;
  q?: string; // search query
}

/**
 * Search listings by ZIP, radius, and optional search query.
 */
export async function searchListings(
  params: SearchListingsParams
): Promise<ListingsBrowseResponse> {
  const searchParams = new URLSearchParams();
  if (params.zip) searchParams.append("zip", params.zip);
  if (params.radius) searchParams.append("radius", params.radius.toString());
  if (params.q) searchParams.append("q", params.q);

  const queryString = searchParams.toString();
  return apiGet<ListingsBrowseResponse>(
    `/api/listings${queryString ? `?${queryString}` : ""}`
  );
}
