/**
 * Care API types: response DTOs and kind union.
 * Use these for the caregivers browse API so server and client stay in sync.
 */

import type { AnimalSpecies, CareServiceType, CareTaskType, ExperienceBackground } from "@prisma/client";

export type CareResultKind = "CARE" | "HELP_EXCHANGE";

export const CARE_RESULT_KIND_VALUES: CareResultKind[] = ["CARE", "HELP_EXCHANGE"];

/** Explicit response DTO for one caregiver in the browse list. Do not spread Prisma/internal fields. */
export interface CaregiverBrowseItem {
  id: string;
  name: string | null;
  zipCode: string;
  distance: number | null;
  featured?: boolean;
  caregiverProfile: {
    bio: string | null;
    yearsExperience: number | null;
    experienceBackground: ExperienceBackground[];
    speciesComfort: AnimalSpecies[];
    tasksComfort: CareTaskType[];
    introVideoUrl: string | null;
    introAudioUrl: string | null;
  } | null;
  listings: Array<{
    id: string;
    title: string;
    serviceType: CareServiceType;
    speciesSupported: AnimalSpecies[];
    rateCents: number;
    rateUnit: string;
  }>;
  kind: CareResultKind;
}

/** Normalized search params echoed in browse response for display/debugging. */
export interface CareSearchEcho {
  zip: string;
  radius: number;
  category?: string;
}

/** Response shape for GET /api/care/caregivers */
export interface CaregiversBrowseResponse {
  caregivers: CaregiverBrowseItem[];
  /** Present when request included a valid category; use for display/grouping. */
  capabilities?: string[];
  /** Normalized search values used for the query. */
  search: CareSearchEcho;
}
