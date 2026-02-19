/**
 * Orders API DTOs: explicit response types for order operations.
 * Do not spread Prisma models - only include fields needed for UI.
 */

/** DTO for order item in browse/list views. */
export interface OrderBrowseItem {
  id: string;
  buyerId: string;
  producerId: string;
  productId: string;
  notes: string | null;
  paid: boolean;
  viaCash: boolean;
  pickupDate: Date;
  createdAt: Date;
  resolutionWindowEndsAt: Date | null;
  pickupCode: string | null;
  /** Producer info (minimal) */
  producer?: {
    id: string;
    name: string | null;
  };
  /** Buyer info (minimal) */
  buyer?: {
    id: string;
    name: string | null;
  };
}

/** Response shape for order creation */
export interface OrderCreateResponse {
  orderId: string;
  pickupCode: string;
}

/** Response shape for order list */
export interface OrdersResponse {
  orders: OrderBrowseItem[];
}
