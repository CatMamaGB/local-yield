/**
 * Listing types for browse: product + producer info + distance and label.
 */

export type ListingLabel = "nearby" | "fartherOut";

export interface BrowseListing {
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
  /** Featured placement in discovery. */
  featured?: boolean;
  /** Average rating (1–5) for producer; null if no reviews. */
  averageRating?: number | null;
  /** Producer marked product as organic; null = not specified. */
  isOrganic?: boolean | null;
  /** Selling unit: each, lb, bunch, dozen, jar, box. Null = each. */
  unit?: string | null;
  /** Present when sorting; stripped in API response. */
  createdAt?: Date;
}

export interface ListingsResponse {
  listings: BrowseListing[];
  items?: BrowseListing[];
  userZip: string | null;
  radiusMiles: number;
  total?: number;
  page?: number;
  pageSize?: number;
}
