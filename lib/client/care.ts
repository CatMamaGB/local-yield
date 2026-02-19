/**
 * Care API client wrappers.
 * Convenience functions for care-related API calls with standardized error handling.
 */

import { apiGet, apiPost } from "./api-client";
import type { CaregiversBrowseResponse } from "@/lib/care/types";

export interface SearchCaregiversParams {
  zip: string;
  radius: number;
  category?: string;
}

export interface CreateBookingInput {
  caregiverId: string;
  startAt: string; // ISO datetime string
  endAt: string; // ISO datetime string
  locationZip: string;
  notes?: string;
  species?: string;
  serviceType?: string;
  idempotencyKey?: string;
}

export interface CreateBookingResponse {
  bookingId: string;
  conversationId: string;
}

/**
 * Search caregivers by ZIP, radius, and optional category.
 */
export async function searchCaregivers(
  params: SearchCaregiversParams
): Promise<CaregiversBrowseResponse> {
  const searchParams = new URLSearchParams({
    zip: params.zip,
    radius: params.radius.toString(),
  });
  if (params.category) {
    searchParams.append("category", params.category);
  }
  return apiGet<CaregiversBrowseResponse>(`/api/care/caregivers?${searchParams.toString()}`);
}

/**
 * Create a care booking request.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResponse> {
  return apiPost<CreateBookingResponse>("/api/care/bookings", input);
}
