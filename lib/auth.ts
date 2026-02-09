/**
 * Auth helpers for The Local Yield.
 * Placeholder for Clerk or Supabase Auth; replace with real implementation.
 */

import type { Role } from "@/types";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  zipCode: string;
}

/** Get current user from session (stub). Replace with Clerk/Supabase. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // TODO: Clerk: const { userId } = auth(); then fetch user from DB
  // TODO: Supabase: const { data: { user } } = await supabase.auth.getUser();
  return null;
}

/** Require auth; redirect to login if not signed in. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized"); // In real app: redirect to /auth/login
  }
  return user;
}

/** Require producer or admin role. */
export async function requireProducerOrAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "PRODUCER" && user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

/** Require admin role. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}
