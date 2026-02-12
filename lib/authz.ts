/**
 * Access control helpers: role checks and require* guards.
 * Use with SessionUser from getCurrentUser().
 */

import type { SessionUser } from "./auth";

export type RoleFlag = "BUYER" | "PRODUCER" | "CAREGIVER" | "CARE_SEEKER" | "ADMIN";

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
  if (!user) return false;
  let count = 0;
  if (user.isBuyer || user.role === "BUYER") count++;
  if (user.isProducer || user.role === "PRODUCER" || user.role === "ADMIN") count++;
  if (user.isCaregiver || user.isHomesteadOwner) count++;
  return count > 1;
}
