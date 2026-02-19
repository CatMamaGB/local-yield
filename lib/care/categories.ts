/**
 * Care categories: first-class landing and filter concept.
 * Separate from CareServiceType (booking model). UI and URL use category;
 * backend receives serviceType via categoryToServiceType for now.
 */

import type { CareServiceType } from "@prisma/client";

export const CARE_CATEGORY_IDS = [
  "LIVESTOCK_CARE",
  "SMALL_ANIMAL_CARE",
  "MILKING_SUPPORT",
  "FEED_TURNOUT",
  "BARN_CLEANUP",
  "OVERNIGHT_COVERAGE",
  "FENCE_REPAIRS",
  "GARDEN_HARVEST",
  "EQUIPMENT_HELP",
] as const;

export type CareCategory = (typeof CARE_CATEGORY_IDS)[number];

export const VALID_CARE_CATEGORIES = new Set<string>(CARE_CATEGORY_IDS);

// Invariant: VALID_CARE_CATEGORIES must match CARE_CATEGORY_IDS (dev-time guard)
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  if (VALID_CARE_CATEGORIES.size !== CARE_CATEGORY_IDS.length) {
    throw new Error("VALID_CARE_CATEGORIES size must match CARE_CATEGORY_IDS length");
  }
  for (const id of CARE_CATEGORY_IDS) {
    if (!VALID_CARE_CATEGORIES.has(id)) {
      throw new Error(`CARE_CATEGORY_IDS contains ${id} but VALID_CARE_CATEGORIES does not`);
    }
  }
}

export const CARE_CATEGORIES = {
  animalCare: [
    { id: "LIVESTOCK_CARE" as const, label: "Livestock Care" },
    { id: "SMALL_ANIMAL_CARE" as const, label: "Small Animal Care" },
    { id: "MILKING_SUPPORT" as const, label: "Milking Support" },
  ],
  barnChores: [
    { id: "FEED_TURNOUT" as const, label: "Feed and Turnout" },
    { id: "BARN_CLEANUP" as const, label: "Stall and Barn Cleanup" },
    { id: "OVERNIGHT_COVERAGE" as const, label: "Overnight Farm Coverage" },
  ],
  helpExchange: [
    { id: "FENCE_REPAIRS" as const, label: "Fence and Repairs" },
    { id: "GARDEN_HARVEST" as const, label: "Garden and Harvest Help" },
    { id: "EQUIPMENT_HELP" as const, label: "Equipment Help" },
  ],
} as const;

export type CareCategoryGroup = keyof typeof CARE_CATEGORIES;

/**
 * Compatibility shim: maps CareCategory → CareServiceType for current DB model.
 * This is lossy. Do not use for UI labeling or analytics.
 * TODO: Replace with category-first filtering / capabilities when backend supports it.
 */
export function categoryToServiceType(category: CareCategory): CareServiceType {
  switch (category) {
    case "LIVESTOCK_CARE":
    case "SMALL_ANIMAL_CARE":
    case "MILKING_SUPPORT":
    case "FEED_TURNOUT":
    case "BARN_CLEANUP":
      return "DROP_IN";
    case "OVERNIGHT_COVERAGE":
    case "FENCE_REPAIRS":
    case "GARDEN_HARVEST":
    case "EQUIPMENT_HELP":
      return "FARM_SITTING";
    default:
      return assertExhaustive(category);
  }
}

function assertExhaustive(c: never): never {
  throw new Error(`Unhandled care category: ${c}`);
}

/**
 * Returns capability/tag strings for a category. Use for future pricing, durations,
 * or booking flows per category without changing the DB yet.
 */
export function categoryToCapabilities(category: CareCategory): string[] {
  switch (category) {
    case "LIVESTOCK_CARE":
      return ["livestock", "drop-in"];
    case "SMALL_ANIMAL_CARE":
      return ["small-animals", "drop-in"];
    case "MILKING_SUPPORT":
      return ["milking", "drop-in"];
    case "FEED_TURNOUT":
      return ["feed", "turnout", "drop-in"];
    case "BARN_CLEANUP":
      return ["barn-cleanup", "drop-in"];
    case "OVERNIGHT_COVERAGE":
      return ["overnight", "farm-sitting"];
    case "FENCE_REPAIRS":
      return ["fence", "repairs", "help-exchange"];
    case "GARDEN_HARVEST":
      return ["garden", "harvest", "help-exchange"];
    case "EQUIPMENT_HELP":
      return ["equipment", "help-exchange"];
    default:
      return assertExhaustive(category);
  }
}

const CAPABILITY_LABELS: Record<string, string> = {
  "drop-in": "Quick visits",
  overnight: "Overnight coverage",
  livestock: "Livestock",
  "small-animals": "Small animals",
  milking: "Milking",
  feed: "Feed",
  turnout: "Turnout",
  "barn-cleanup": "Barn chores",
  "farm-sitting": "Farm sitting",
  fence: "Fence",
  repairs: "Repairs",
  "help-exchange": "Help exchange",
  garden: "Garden",
  harvest: "Harvest",
  equipment: "Equipment",
};

/**
 * User-facing label for a capability tag. Use for chips/display; unknown keys get hyphen→space fallback.
 */
export function capabilityLabel(cap: string): string {
  return CAPABILITY_LABELS[cap] ?? cap.replace(/-/g, " ");
}

/** Flatten category id → display label for location summary and UI. */
const CATEGORY_LABEL_MAP: Record<CareCategory, string> = {
  LIVESTOCK_CARE: "Livestock Care",
  SMALL_ANIMAL_CARE: "Small Animal Care",
  MILKING_SUPPORT: "Milking Support",
  FEED_TURNOUT: "Feed and Turnout",
  BARN_CLEANUP: "Stall and Barn Cleanup",
  OVERNIGHT_COVERAGE: "Overnight Farm Coverage",
  FENCE_REPAIRS: "Fence and Repairs",
  GARDEN_HARVEST: "Garden and Harvest Help",
  EQUIPMENT_HELP: "Equipment Help",
};

export function getCategoryLabel(category: CareCategory): string {
  return CATEGORY_LABEL_MAP[category] ?? category;
}
