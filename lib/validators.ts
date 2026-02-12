/**
 * Zod validation schemas for API request validation.
 */

import { z } from "zod";

/**
 * 5-digit ZIP code validation
 */
export const ZipSchema = z.string().regex(/^\d{5}$/, "Must be a valid 5-digit ZIP code");

/**
 * Order item validation
 */
export const OrderItemSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(999, "Quantity cannot exceed 999"),
  unitPriceCents: z.number().int().min(0, "Price must be non-negative"),
});

/**
 * Create order request validation
 */
export const CreateOrderSchema = z.object({
  producerId: z.string().min(1, "Producer ID required"),
  items: z.array(OrderItemSchema).min(1, "At least one item required"),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]).optional(),
  notes: z.string().optional(),
  pickupDate: z.union([z.string().datetime(), z.date(), z.string()]).optional().transform((val) => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    return new Date(val);
  }),
});

/**
 * Update order status validation
 */
export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FULFILLED", "CANCELED", "REFUNDED"]),
});

/** Sign-up role ids (no ADMIN). Stored as booleans: CARE_SEEKER -> isHomesteadOwner. */
export const SignUpRoleSchema = z.enum(["BUYER", "PRODUCER", "CAREGIVER", "CARE_SEEKER"]);

/** Primary mode: what user wants to do most often; drives post-onboarding redirect. */
export const PrimaryModeSchema = z.enum(["MARKET", "SELL", "CARE"]);

/** How the user plans to use the platform. */
export const PlatformUseSchema = z.enum([
  "BUY_LOCAL_GOODS",
  "SELL_PRODUCTS",
  "FIND_ANIMAL_CARE",
  "OFFER_ANIMAL_CARE",
  "BOTH_MARKET_AND_CARE",
  "OTHER",
]);

/**
 * Signup request: identity + contact + location + roles + primaryMode.
 * platformUse is derived on the server from roles/primaryMode.
 */
export const SignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().trim().min(1, "Phone is required"),
  zipCode: ZipSchema,
  roles: z.array(SignUpRoleSchema).min(1, "Select at least one role"),
  primaryMode: PrimaryModeSchema,
  addressLine1: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
});

/**
 * Onboarding request validation
 */
export const OnboardingSchema = z.object({
  zipCode: ZipSchema,
  /** Optional: set role flags on first onboarding (never includes ADMIN). */
  roles: z.array(SignUpRoleSchema).optional(),
  /** Primary mode for first landing. */
  primaryMode: PrimaryModeSchema.optional(),
});

/**
 * Profile update validation (producer business page + delivery)
 */
export const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(1).optional().or(z.null()),
  bio: z.string().trim().optional().or(z.null()),
  zipCode: ZipSchema.optional(),
  offersDelivery: z.boolean().optional(),
  deliveryFeeCents: z.number().int().min(0).optional(),
  pickupNotes: z.string().trim().optional().or(z.null()),
  pickupZipCode: ZipSchema.optional().or(z.null()),
  aboutUs: z.string().trim().max(10000).optional().or(z.null()),
  story: z.string().trim().max(5000).optional().or(z.null()),
  profileImageUrl: z.string().url().optional().or(z.null()),
  contactEmail: z.string().email().optional().or(z.null()),
  generalLocation: z.string().trim().max(200).optional().or(z.null()),
  availabilityHours: z.string().trim().max(500).optional().or(z.null()),
  acceptInAppMessagesOnly: z.boolean().optional(),
});

/**
 * Product catalog form validation (producer add/edit product).
 * Category is validated against a dynamic list; use ProductCatalogFormSchema.refine() at runtime if needed.
 */
export const ProductCatalogFormSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  unit: z.string().min(1, "Unit is required").max(100, "Unit is too long"),
  price: z.number().min(0, "Price must be 0 or greater"),
  quantityInStock: z.number().int().min(0, "Quantity must be 0 or greater"),
  customImageFile: z.instanceof(File).optional().nullable(),
});
