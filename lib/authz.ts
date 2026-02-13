/**
 * Access control helpers: role checks and require* guards.
 * Use with SessionUser from getCurrentUser().
 * Centralize all role/capability logic here so nav and layouts stay in sync.
 */

import type { SessionUser } from "./auth";

export type RoleFlag = "BUYER" | "PRODUCER" | "CAREGIVER" | "CARE_SEEKER" | "ADMIN";

/** Single source of truth for what the user can do. Use this everywhere (nav, layout, guards). */
export interface UserCapabilities {
  canSell: boolean;
  canAdmin: boolean;
  canCare: boolean;
  isMultiMode: boolean;
}

export function getUserCapabilities(user: SessionUser | null): UserCapabilities {
  if (!user) {
    return { canSell: false, canAdmin: false, canCare: false, isMultiMode: false };
  }
  const canSell = user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;
  const canAdmin = user.role === "ADMIN";
  const canCare = user.isCaregiver === true || user.isHomesteadOwner === true;
  let modeCount = 0;
  if (user.isBuyer || user.role === "BUYER") modeCount++;
  if (canSell) modeCount++;
  if (canCare) modeCount++;
  const isMultiMode = modeCount > 1;
  return { canSell, canAdmin, canCare, isMultiMode };
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
