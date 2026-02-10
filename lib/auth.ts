/**
 * Auth helpers for The Local Yield.
 * Phase 1: Stub only — return dummy user. No Clerk/Supabase yet.
 * Add real auth when: producers post products, buyers save info, dashboards need login.
 * In development, a dev-only role switcher cookie (__dev_user) selects among stub users.
 */

import { cookies } from "next/headers";
import type { Role } from "@/types";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  zipCode: string;
}

/** Stub users for development/testing. Used when auth is not yet wired. */
const STUB_BUYER: SessionUser = {
  id: "stub-buyer-1",
  email: "buyer@test.localyield.example",
  name: "Test Buyer",
  role: "BUYER",
  zipCode: "90210",
};

const STUB_PRODUCER: SessionUser = {
  id: "stub-producer-1",
  email: "producer@test.localyield.example",
  name: "Test Producer",
  role: "PRODUCER",
  zipCode: "90210",
};

const STUB_ADMIN: SessionUser = {
  id: "stub-admin-1",
  email: "admin@test.localyield.example",
  name: "Test Admin",
  role: "ADMIN",
  zipCode: "90210",
};

const STUB_USERS: Record<Role, SessionUser> = {
  BUYER: STUB_BUYER,
  PRODUCER: STUB_PRODUCER,
  ADMIN: STUB_ADMIN,
};

/** Default for production when auth is stubbed. Replace with real session in Phase 1.5/2. */
const DUMMY_USER: SessionUser = STUB_BUYER;

/**
 * Get current user from session.
 * Phase 1: In development, reads __dev_user cookie and returns matching stub (BUYER/PRODUCER/ADMIN).
 * Otherwise returns DUMMY_USER. Phase 1.5/2: Replace with Clerk/Supabase — return null when not signed in.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // TODO: Clerk: const { userId } = auth(); then fetch user from DB
  // TODO: Supabase: const { data: { user } } = await supabase.auth.getUser();

  if (process.env.NODE_ENV === "development") {
    const cookieStore = await cookies();
    const devUser = cookieStore.get("__dev_user")?.value as Role | undefined;
    if (devUser && (devUser === "BUYER" || devUser === "PRODUCER" || devUser === "ADMIN")) {
      return STUB_USERS[devUser];
    }
  }

  return DUMMY_USER;
}

/** Require auth; throws if not signed in. Phase 1: always succeeds (dummy). */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized"); // In real app: redirect to /auth/login
  }
  return user;
}

/** Require producer or admin role. Phase 1: use dummy (BUYER) and will throw; or switch DUMMY_USER.role for demo. */
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
