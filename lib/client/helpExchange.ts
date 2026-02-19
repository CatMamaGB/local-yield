/**
 * Help Exchange API client wrappers.
 * Convenience functions for help exchange API calls with standardized error handling.
 */

import { apiGet, apiPost } from "./api-client";

export interface ListHelpExchangePostingsParams {
  zip: string;
  radius: number;
}

export interface CreateHelpExchangePostingInput {
  title: string;
  description: string;
  category: "FENCE_REPAIRS" | "GARDEN_HARVEST" | "EQUIPMENT_HELP";
  zipCode: string;
  radiusMiles?: number;
}

export interface HelpExchangePosting {
  id: string;
  createdById: string;
  title: string;
  description: string;
  category: string;
  zipCode: string;
  radiusMiles: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
  };
}

export interface ListHelpExchangePostingsResponse {
  postings: HelpExchangePosting[];
}

export interface CreateHelpExchangePostingResponse {
  posting: HelpExchangePosting;
}

/**
 * List help exchange postings by ZIP and radius.
 */
export async function listHelpExchangePostings(
  params: ListHelpExchangePostingsParams
): Promise<ListHelpExchangePostingsResponse> {
  const searchParams = new URLSearchParams({
    zip: params.zip,
    radius: params.radius.toString(),
  });
  return apiGet<ListHelpExchangePostingsResponse>(
    `/api/help-exchange/postings?${searchParams.toString()}`
  );
}

/**
 * Create a help exchange posting.
 */
export async function createHelpExchangePosting(
  input: CreateHelpExchangePostingInput
): Promise<CreateHelpExchangePostingResponse> {
  return apiPost<CreateHelpExchangePostingResponse>(
    "/api/help-exchange/postings",
    input
  );
}
