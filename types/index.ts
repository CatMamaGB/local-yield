/**
 * The Local Yield - Shared types for User, Product, Order, Event, Review, etc.
 * Aligns with Prisma schema; use for API and component props.
 */

export type Role = "BUYER" | "PRODUCER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  zipCode: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stockImage: string | null;
  imageUrl: string | null;
  category: string;
  delivery: boolean;
  pickup: boolean;
  userId: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  buyerId: string;
  producerId: string;
  productId: string;
  notes: string | null;
  paid: boolean;
  viaCash: boolean;
  pickupDate: Date;
  createdAt: Date;
  /** After this time, buyer may publish a negative public review (resolution window). */
  resolutionWindowEndsAt: Date | null;
  /** Pickup code / QR for event or pickup (show at confirmation). */
  pickupCode: string | null;
}

export interface Event {
  id: string;
  userId: string;
  name: string;
  location: string;
  eventDate: Date;
  allowPreorder: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  reviewerId: string;
  producerId: string;
  orderId: string;
  privateFlag: boolean;
  comment: string;
  resolved: boolean;
  createdAt: Date;
  /** Structured rating 1–5 (short + structured public reviews). */
  rating: number | null;
  /** Producer response: fix/refund/replace. */
  producerResponse: string | null;
  /** Admin moderation: hide abusive content. */
  hiddenByAdmin: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  producerId: string;
  weeklyBox: boolean;
  active: boolean;
  createdAt: Date;
}

/** For location-filtered browse (ZIP + radius) */
export interface LocationFilter {
  zipCode: string;
  radiusMiles?: number;
}

/** Request an item: buyers ask for eggs, honey, etc.; producers see demand in radius. */
export interface ItemRequest {
  id: string;
  requesterId: string;
  description: string;
  zipCode: string;
  radiusMiles: number | null;
  status: string;
  createdAt: Date;
}
