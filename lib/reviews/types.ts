/**
 * Reviews API DTOs: explicit response types for review operations.
 * Do not spread Prisma models - only include fields needed for UI.
 */

export type ReviewType = "MARKET" | "CARE";

/** DTO for review in browse/list views. */
export interface ReviewBrowseItem {
  id: string;
  reviewerId: string;
  revieweeId: string;
  producerId: string;
  type: ReviewType;
  orderId: string | null;
  careBookingId: string | null;
  privateFlag: boolean;
  comment: string;
  resolved: boolean;
  createdAt: Date;
  rating: number | null;
  producerResponse: string | null;
  hiddenByAdmin: boolean;
  /** Reviewer info (minimal) */
  reviewer?: {
    id: string;
    name: string | null;
  };
  /** Reviewee info (minimal) */
  reviewee?: {
    id: string;
    name: string | null;
  };
}

/** Response shape for review list */
export interface ReviewsResponse {
  reviews: ReviewBrowseItem[];
}

/** Response shape for single review */
export interface ReviewResponse {
  review: ReviewBrowseItem;
}
