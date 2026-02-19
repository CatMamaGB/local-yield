/**
 * Market API DTOs: explicit response types for listings browse.
 * Do not spread Prisma models - only include fields needed for UI.
 */

export type ListingLabel = "nearby" | "fartherOut";

/** DTO for one listing in browse results. */
export interface ListingBrowseItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stockImage: string | null;
  category: string;
  delivery: boolean;
  pickup: boolean;
  producerId: string;
  producerName: string | null;
  zip: string;
  /** Distance in miles from user ZIP. */
  distance: number | null;
  /** Within radius = nearby, else fartherOut. */
  label: ListingLabel;
}

/** Response shape for GET /api/listings */
export interface ListingsBrowseResponse {
  listings: ListingBrowseItem[];
  userZip: string | null;
  radiusMiles: number;
}
