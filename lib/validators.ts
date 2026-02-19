/**
 * Zod validation schemas for API request validation.
 */

import { z } from "zod";
import { MAX_RADIUS_MILES } from "@/lib/geo/constants";
import { ALLOWED_CATEGORY_IDS } from "@/lib/catalog-categories";

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
  appliedCreditCents: z.number().int().min(0).optional(),
  idempotencyKey: z.string().min(1).optional(),
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
  /** Optional; when missing store null. Only require when feature needs it (browse, post job, seller pickup). */
  zipCode: z.union([ZipSchema, z.literal("")]).optional(),
  /** Buyer is always on; form sends only "what else" (PRODUCER, CAREGIVER, CARE_SEEKER). Empty = Buyer only. */
  roles: z.array(SignUpRoleSchema).default([]),
  primaryMode: PrimaryModeSchema,
  addressLine1: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
});

/**
 * Onboarding request validation. Only hard-require terms; ZIP can be skipped (gentle prompt later).
 */
export const OnboardingSchema = z.object({
  /** Must be true to complete onboarding (stops redirect loops). */
  termsAccepted: z.literal(true),
  /** 5-digit ZIP; optional to allow "skip for now" (show gentle banner later). */
  zipCode: z.union([ZipSchema, z.literal("")]).optional(),
  /** Optional: set role flags on first onboarding (never includes ADMIN). */
  roles: z.array(SignUpRoleSchema).optional(),
  /** Primary mode for first landing (preference only; routing uses lastActiveMode). */
  primaryMode: PrimaryModeSchema.optional(),
  /** Optional: safe internal path for post-onboarding redirect (next=). Validated in redirect logic. */
  requestedUrl: z.string().optional(),
});

/**
 * Account update validation (shared: name, contact, address for all users).
 * Used for buyer/producer/care profile "account" section.
 */
export const AccountUpdateSchema = z.object({
  name: z.string().trim().max(200, "Name is too long").optional(),
  phone: z.string().trim().min(1, "Phone is required").max(50, "Phone is too long").optional(),
  zipCode: z.union([ZipSchema, z.literal("")]).optional(),
  addressLine1: z.string().trim().max(200, "Address line is too long").optional(),
  city: z.string().trim().max(100, "City is too long").optional(),
  state: z.string().trim().max(50, "State is too long").optional(),
  allowProducerExport: z.boolean().optional(),
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

/**
 * Care enums for validation
 */
export const AnimalSpeciesSchema = z.enum([
  "HORSES",
  "CATTLE",
  "GOATS",
  "SHEEP",
  "PIGS",
  "POULTRY",
  "ALPACAS",
  "LLAMAS",
  "DONKEYS",
  "OTHER",
]);

export const CareServiceTypeSchema = z.enum([
  "DROP_IN",
  "OVERNIGHT",
  "BOARDING",
  "FARM_SITTING",
]);

export const CareTaskTypeSchema = z.enum([
  "FEEDING",
  "WATERING",
  "MUCKING",
  "TURNOUT",
  "MEDS_ORAL",
  "MEDS_INJECTION",
  "WOUND_CARE",
  "HERD_CHECK",
  "EGG_COLLECTION",
  "MILKING",
  "LAMBING_FOALING_SUPPORT",
  "EQUIPMENT_USE",
  "OTHER",
]);

export const ExperienceBackgroundSchema = z.enum([
  "GREW_UP_FARM",
  "FAMILY_OPERATION",
  "RANCH_WORK",
  "BARN_MANAGER",
  "VET_ASSISTANT",
  "SHOW_CIRCUIT",
  "SELF_TAUGHT",
  "FORMAL_AG_EDU",
  "FFA_4H",
  "OTHER",
]);

export const CareBookingStatusSchema = z.enum([
  "REQUESTED",
  "ACCEPTED",
  "DECLINED",
  "CANCELED",
  "COMPLETED",
]);

export const HelpExchangeCategorySchema = z.enum([
  "FENCE_REPAIRS",
  "GARDEN_HARVEST",
  "EQUIPMENT_HELP",
]);

export const HelpExchangeStatusSchema = z.enum([
  "OPEN",
  "FILLED",
  "CLOSED",
]);

/**
 * Create care booking request validation
 */
export const CreateCareBookingSchema = z.object({
  caregiverId: z.string().min(1, "Caregiver ID required"),
  startAt: z.string().datetime("Valid start date/time required"),
  endAt: z.string().datetime("Valid end date/time required"),
  locationZip: ZipSchema,
  notes: z.string().trim().optional(),
  species: AnimalSpeciesSchema.optional(),
  serviceType: CareServiceTypeSchema.optional(),
  idempotencyKey: z.string().min(1).optional(), /// Prevents double-click double-booking
}).refine((data) => {
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endAt"],
}).refine((data) => {
  const start = new Date(data.startAt);
  const now = new Date();
  // Allow same-day bookings (start can be today)
  return start >= new Date(now.setHours(0, 0, 0, 0));
}, {
  message: "Start date must be today or in the future",
  path: ["startAt"],
}).refine((data) => {
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  const maxDurationDays = 90;
  const durationMs = end.getTime() - start.getTime();
  const durationDays = durationMs / (1000 * 60 * 60 * 24);
  return durationDays <= maxDurationDays;
}, {
  message: `Booking duration cannot exceed ${90} days`,
  path: ["endAt"],
});

/**
 * Update care booking status validation
 */
export const UpdateCareBookingStatusSchema = z.object({
  status: CareBookingStatusSchema,
});

/**
 * Create help exchange posting validation
 */
export const CreateHelpExchangePostingSchema = z.object({
  title: z.string().min(1, "Title required").max(200, "Title too long"),
  description: z.string().min(1, "Description required").max(2000, "Description too long"),
  category: HelpExchangeCategorySchema,
  zipCode: ZipSchema,
  radiusMiles: z.number().int().min(1).max(MAX_RADIUS_MILES).optional(),
});

/**
 * Create care service listing validation
 */
export const CreateCareServiceListingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  serviceType: CareServiceTypeSchema,
  speciesSupported: z.array(AnimalSpeciesSchema).min(1, "Select at least one species"),
  tasksSupported: z.array(CareTaskTypeSchema).min(1, "Select at least one task"),
  rateCents: z.number().int().min(0, "Rate must be non-negative"),
  rateUnit: z.string().trim().min(1, "Rate unit is required").max(50, "Rate unit too long"),
  serviceRadiusMiles: z.number().int().min(1, "Service radius must be at least 1 mile").max(MAX_RADIUS_MILES, "Service radius cannot exceed 150 miles"),
  description: z.string().trim().max(2000, "Description too long").optional(),
  active: z.boolean().optional().default(true),
});

/**
 * Update caregiver profile validation (trust signals)
 */
export const UpdateCaregiverProfileSchema = z.object({
  bio: z.string().trim().max(2000, "Bio too long").optional().or(z.null()),
  yearsExperience: z.number().int().min(0).max(100).optional().or(z.null()),
  experienceBackground: z.array(ExperienceBackgroundSchema).optional(),
  speciesComfort: z.array(AnimalSpeciesSchema).optional(),
  tasksComfort: z.array(CareTaskTypeSchema).optional(),
  introVideoUrl: z.string().url("Valid video URL required").optional().or(z.null()),
  introAudioUrl: z.string().url("Valid audio URL required").optional().or(z.null()),
  referencesText: z.string().trim().max(2000, "References text too long").optional().or(z.null()),
  languagesSpoken: z.string().trim().max(200, "Languages text too long").optional().or(z.null()),
});

/**
 * Query parameter validation schemas for GET endpoints
 */

/** Max pageSize for public list endpoints. */
const PAGE_SIZE_MAX_PUBLIC = 50;
/** Max pageSize for admin list endpoints. */
const PAGE_SIZE_MAX_ADMIN = 100;

/**
 * Listings query validation (GET /api/listings)
 */
export const ListingsQuerySchema = z.object({
  zip: ZipSchema.optional().or(z.literal("")),
  radius: z.coerce.number().int().min(1, "Radius must be at least 1 mile").max(MAX_RADIUS_MILES, `Radius cannot exceed ${MAX_RADIUS_MILES} miles`).optional(),
  q: z.string().trim().max(200, "Search query too long").optional(),
  group: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  sort: z.enum(["distance", "newest", "price_asc", "rating"]).optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").optional(),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX_PUBLIC, `Page size cannot exceed ${PAGE_SIZE_MAX_PUBLIC}`).optional(),
});

/** Product category must be one of the allowed subcategory IDs (for create/update). */
export const ProductCategorySchema = z.string().trim().min(1).refine(
  (val) => (ALLOWED_CATEGORY_IDS as readonly string[]).includes(val),
  { message: "Category must be one of the allowed category IDs" }
);

/** Allowed product units for price/quantity clarity (browse, comparison, professional listing). */
export const ALLOWED_PRODUCT_UNITS = ["each", "lb", "bunch", "dozen", "jar", "box"] as const;
export type ProductUnit = (typeof ALLOWED_PRODUCT_UNITS)[number];
export const ProductUnitSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || (ALLOWED_PRODUCT_UNITS as readonly string[]).includes(val), {
    message: "Unit must be one of: each, lb, bunch, dozen, jar, box",
  })
  .transform((val) => (val === "" ? null : val));

/**
 * Caregivers query validation (GET /api/care/caregivers)
 */
export const CaregiversQuerySchema = z.object({
  zip: ZipSchema,
  radius: z.coerce.number().int().min(1, "Radius must be at least 1 mile").max(MAX_RADIUS_MILES, `Radius cannot exceed ${MAX_RADIUS_MILES} miles`).optional(),
  species: AnimalSpeciesSchema.optional(),
  serviceType: CareServiceTypeSchema.optional(),
  category: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX_PUBLIC).optional(),
});

/**
 * Item requests query validation (GET /api/item-requests)
 */
export const ItemRequestsQuerySchema = z.object({
  zip: ZipSchema,
  radius: z.coerce.number().int().min(1, "Radius must be at least 1 mile").max(MAX_RADIUS_MILES, `Radius cannot exceed ${MAX_RADIUS_MILES} miles`).optional(),
});

/** Order dispute problem types (for reports entityType=order) */
export const OrderDisputeProblemTypeSchema = z.enum([
  "LATE", "DAMAGED", "MISSING", "NOT_AS_DESCRIBED", "WRONG_ITEM", "OTHER",
]);

/** Order dispute proposed outcomes */
export const OrderDisputeProposedOutcomeSchema = z.enum([
  "REFUND", "PARTIAL_REFUND", "REPLACEMENT", "STORE_CREDIT", "OTHER",
]);

/** Report attachment (URL + metadata; max 3 per report) */
export const ReportAttachmentSchema = z.object({
  url: z.string().url(),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
});

/**
 * Reports query validation (GET /api/reports - admin or mine/forMe)
 */
export const ReportsQuerySchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]).optional(),
  entityType: z.enum(["caregiver", "help_exchange_posting", "order"]).optional(),
  mine: z.string().optional(),
  forMe: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX_ADMIN).optional(),
});

/**
 * Dashboard conversations query validation (GET /api/dashboard/conversations)
 */
export const ConversationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX_PUBLIC).optional(),
});

/** Send message body (POST /api/dashboard/conversations/[id]/messages) */
export const SendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(10000, "Message too long"),
});

/**
 * Admin users query validation (GET /api/admin/users)
 */
export const AdminUsersQuerySchema = z.object({
  q: z.string().trim().max(200, "Search query too long").optional(),
  role: z.string().trim().max(50).optional(),
  capability: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX_ADMIN).optional(),
});

/**
 * Admin listings query validation (GET /api/admin/listings)
 */
export const AdminListingsQuerySchema = z.object({
  type: z.enum(["market", "care"]).optional(),
  active: z.coerce.boolean().optional(),
  q: z.string().trim().max(200, "Search query too long").optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX_ADMIN).optional(),
});

/**
 * Admin bookings query validation (GET /api/admin/bookings)
 */
export const AdminBookingsQuerySchema = z.object({
  status: CareBookingStatusSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX_ADMIN).optional(),
});

/**
 * Admin custom categories query validation (GET /api/admin/custom-categories)
 */
export const AdminCustomCategoriesQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(5).max(50, "Limit cannot exceed 50").optional(),
  search: z.string().trim().max(200, "Search query too long").optional(),
});
