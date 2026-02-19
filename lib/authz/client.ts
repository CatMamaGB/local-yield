/**
 * Client-safe authorization helpers.
 * These functions only work with SessionUser data, no server calls.
 */

import type { SessionUser } from "../auth/types";

export type RoleFlag = "BUYER" | "PRODUCER" | "CAREGIVER" | "CARE_SEEKER" | "ADMIN";

/** Single source of truth for what the user can do. Use this everywhere (nav, layout, guards). */
export interface UserCapabilities {
  canSell: boolean;
  canBuy: boolean;
  canAdmin: boolean;
  /** Offer help (caregiver) — distinct from canHireHelp for multi-mode count. */
  canOfferHelp: boolean;
  /** Hire help (care seeker) — distinct from canOfferHelp for multi-mode count. */
  canHireHelp: boolean;
  /** True if either offer or hire (backward compat; nav uses single "Care" surface). */
  canCare: boolean;
  canPostCareJob: boolean;
  canBeHelper: boolean;
  canViewCare: boolean;
  isMultiMode: boolean;
}

export function getUserCapabilities(user: SessionUser | null): UserCapabilities {
  if (!user) {
    return {
      canSell: false,
      canBuy: false,
      canAdmin: false,
      canOfferHelp: false,
      canHireHelp: false,
      canCare: false,
      canPostCareJob: false,
      canBeHelper: false,
      canViewCare: true,
      isMultiMode: false,
    };
  }
  const canSell = user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;
  const canBuy = user.isBuyer === true || user.role === "BUYER";
  const canAdmin = user.role === "ADMIN";
  const canOfferHelp = user.isCaregiver === true || user.role === "ADMIN";
  const canHireHelp = user.isHomesteadOwner === true || user.role === "ADMIN";
  const canCare = canOfferHelp || canHireHelp;
  const canPostCareJob = canHireHelp;
  const canBeHelper = canOfferHelp;
  const canViewCare = true;
  // Show mode switcher when 2+ distinct capabilities beyond Buyer (Sell, Offer help, Hire help).
  const modesBeyondBuyer = (canSell ? 1 : 0) + (canOfferHelp ? 1 : 0) + (canHireHelp ? 1 : 0);
  const isMultiMode = modesBeyondBuyer >= 2;
  return {
    canSell,
    canBuy,
    canAdmin,
    canOfferHelp,
    canHireHelp,
    canCare,
    canPostCareJob,
    canBeHelper,
    canViewCare,
    isMultiMode,
  };
}

/** Explicit capability check functions. Use these instead of direct role checks. */
export function canSell(user: SessionUser | null): boolean {
  return getUserCapabilities(user).canSell;
}

export function canBuy(user: SessionUser | null): boolean {
  return getUserCapabilities(user).canBuy;
}

export function canAdmin(user: SessionUser | null): boolean {
  return getUserCapabilities(user).canAdmin;
}

export function canPostCareJob(user: SessionUser | null): boolean {
  return getUserCapabilities(user).canPostCareJob;
}

export function canBeHelper(user: SessionUser | null): boolean {
  return getUserCapabilities(user).canBeHelper;
}

export function canViewCare(user: SessionUser | null): boolean {
  return getUserCapabilities(user).canViewCare;
}

/** True if user has the given role (by primary role or role flags). */
export function hasRole(user: SessionUser | null, role: RoleFlag): boolean {
  if (!user) return false;
  if (role === "ADMIN") return user.role === "ADMIN";
  if (role === "PRODUCER") return user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;
  if (role === "BUYER") return user.isBuyer === true || user.role === "BUYER";
  if (role === "CAREGIVER") return user.isCaregiver === true;
  if (role === "CARE_SEEKER") return user.isHomesteadOwner === true;
  return false;
}

/** True if user has multiple selectable modes (Market, Sell, Care). */
export function hasMultipleModes(user: SessionUser | null): boolean {
  return getUserCapabilities(user).isMultiMode;
}
