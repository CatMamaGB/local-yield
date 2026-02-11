/**
 * Auth helpers for The Local Yield.
 * When Clerk is configured: use auth() + currentUser(), sync user to DB by clerkId.
 * When not: dev stub (__dev_user cookie) or null for unauthenticated.
 */

import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Role } from "@/types";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  zipCode: string;
  isProducer?: boolean;
  isBuyer?: boolean;
  isCaregiver?: boolean;
  isHomesteadOwner?: boolean;
}

/** Default zip when syncing from Clerk (user should set in profile). */
const DEFAULT_ZIP = "00000";

/** Stub users for development when Clerk is not configured. */
const STUB_BUYER: SessionUser = {
  id: "stub-buyer-1",
  email: "buyer@test.localyield.example",
  name: "Test Buyer",
  role: "BUYER",
  zipCode: "90210",
  isBuyer: true,
  isProducer: false,
  isCaregiver: false,
  isHomesteadOwner: false,
};

const STUB_PRODUCER: SessionUser = {
  id: "stub-producer-1",
  email: "producer@test.localyield.example",
  name: "Test Producer",
  role: "PRODUCER",
  zipCode: "90210",
  isProducer: true,
  isBuyer: false,
  isCaregiver: false,
  isHomesteadOwner: false,
};

const STUB_ADMIN: SessionUser = {
  id: "stub-admin-1",
  email: "admin@test.localyield.example",
  name: "Test Admin",
  role: "ADMIN",
  zipCode: "90210",
  isProducer: false,
  isBuyer: true,
  isCaregiver: false,
  isHomesteadOwner: false,
};

const STUB_USERS: Record<Role, SessionUser> = {
  BUYER: STUB_BUYER,
  PRODUCER: STUB_PRODUCER,
  ADMIN: STUB_ADMIN,
};

function isClerkConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

/**
 * Sync Clerk user to DB: find by clerkId or create. Returns DB User as SessionUser.
 */
async function syncClerkUserToDb(clerkId: string, email: string, name: string | null): Promise<SessionUser | null> {
  const existing = await prisma.user.findUnique({
    where: { clerkId },
  });
  const emailSafe = email || `${clerkId}@clerk.local`;
  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        email: emailSafe,
        name: name ?? existing.name,
      },
    });
    return dbUserToSessionUser(updated);
  }
  const created = await prisma.user.create({
    data: {
      clerkId,
      email: emailSafe,
      name: name ?? null,
      zipCode: DEFAULT_ZIP,
      role: "BUYER",
      isBuyer: true,
      isProducer: false,
      isCaregiver: false,
      isHomesteadOwner: false,
    },
  });
  return dbUserToSessionUser(created);
}

function dbUserToSessionUser(u: {
  id: string;
  email: string;
  name: string | null;
  role: "BUYER" | "PRODUCER" | "ADMIN";
  zipCode: string;
  isProducer: boolean;
  isBuyer: boolean;
  isCaregiver: boolean;
  isHomesteadOwner: boolean;
}): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    zipCode: u.zipCode,
    isProducer: u.isProducer,
    isBuyer: u.isBuyer,
    isCaregiver: u.isCaregiver,
    isHomesteadOwner: u.isHomesteadOwner,
  };
}

/**
 * Get current user from session. Returns null when not signed in (Clerk) or when using stub and no dev cookie.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isClerkConfigured()) {
    const { userId } = await clerkAuth();
    if (!userId) return null;
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";
    const name = clerkUser?.firstName || clerkUser?.lastName
      ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
      : clerkUser?.username ?? null;
    return syncClerkUserToDb(userId, email, name);
  }

  if (process.env.NODE_ENV === "development") {
    const cookieStore = await cookies();
    const devUser = cookieStore.get("__dev_user")?.value as Role | undefined;
    const devZip = cookieStore.get("__dev_zip")?.value?.trim().slice(0, 5);
    if (devUser && (devUser === "BUYER" || devUser === "PRODUCER" || devUser === "ADMIN")) {
      const session = { ...STUB_USERS[devUser] };
      if (devZip && /^\d{5}$/.test(devZip)) session.zipCode = devZip;
      return session;
    }
  }

  return null;
}

/** Require auth; throws (Clerk will redirect to sign-in when middleware protects). */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireProducerOrAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "PRODUCER" && user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}
