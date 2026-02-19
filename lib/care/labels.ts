/**
 * Centralized care UI labels for service types and species.
 * Keeps display strings in sync with Prisma enums (CareServiceType, AnimalSpecies).
 */

import type { CareServiceType, AnimalSpecies } from "@prisma/client";

export const SERVICE_TYPE_LABELS: Record<CareServiceType, string> = {
  DROP_IN: "Drop-in visits",
  OVERNIGHT: "Overnight care",
  BOARDING: "Overnight farm coverage",
  FARM_SITTING: "Farm sitting",
};

export const SPECIES_LABELS: Record<AnimalSpecies, string> = {
  HORSES: "Horses",
  CATTLE: "Cattle",
  GOATS: "Goats",
  SHEEP: "Sheep",
  PIGS: "Pigs",
  POULTRY: "Poultry",
  ALPACAS: "Alpacas",
  LLAMAS: "Llamas",
  DONKEYS: "Donkeys",
  OTHER: "Other",
};
