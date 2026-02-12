/**
 * Auth helpers for The Local Yield.
 * When Clerk is configured: use auth() + currentUser(), sync user to DB by clerkId.
 * When not: dev stub (__dev_user cookie) or null for unauthenticated.
 */

import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Role } from "@/types";
import type { PrimaryMode } from "./redirects";
import { PlatformUse, Role as PrismaRole } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  zipCode: string;
  primaryMode?: PrimaryMode | null;
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
  primaryMode: "MARKET",
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
  primaryMode: "SELL",
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
  primaryMode: "SELL",
  isProducer: false,
  isBuyer: false,
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
 * For new users, zipCode is set to DEFAULT_ZIP ("00000") to force onboarding flow.
 * Clerk metadata can be checked here if ZIP is stored in publicMetadata/unsafeMetadata.
 */
async function syncClerkUserToDb(
  clerkId: string,
  email: string,
  name: string | null,
  clerkUser?: { publicMetadata?: Record<string, any>; unsafeMetadata?: Record<string, any> }
): Promise<SessionUser | null> {
  const existing = await prisma.user.findUnique({
    where: { clerkId },
    include: { userRoles: true },
  });
  const emailSafe = email || `${clerkId}@clerk.local`;
  
  // Try to extract ZIP from Clerk metadata (if available)
  let zipFromClerk: string | null = null;
  if (clerkUser) {
    const zip = clerkUser.publicMetadata?.zipCode || clerkUser.unsafeMetadata?.zipCode;
    if (zip && /^\d{5}$/.test(String(zip))) {
      zipFromClerk = String(zip);
    }
  }

  if (existing) {
    const updateData: { email: string; name?: string | null; zipCode?: string } = {
      email: emailSafe,
      name: name ?? existing.name,
    };
    
    // Only update ZIP if it's still the default and we have a value from Clerk
    if (existing.zipCode === DEFAULT_ZIP && zipFromClerk) {
      updateData.zipCode = zipFromClerk;
    }
    
    await prisma.user.update({
      where: { id: existing.id },
      data: updateData,
    });
    const updated = await prisma.user.findUnique({
      where: { id: existing.id },
      include: { userRoles: true },
    });
    return updated ? dbUserToSessionUser(updated) : dbUserToSessionUser(existing);
  }
  
  // New user: use ZIP from Clerk metadata if available, otherwise DEFAULT_ZIP to force onboarding
  const created = await prisma.user.create({
    data: {
      clerkId,
      email: emailSafe,
      name: name ?? null,
      phone: "",
      zipCode: zipFromClerk ?? DEFAULT_ZIP,
      platformUse: PlatformUse.OTHER,
      role: PrismaRole.BUYER,
      isBuyer: true,
      isProducer: false,
      isCaregiver: false,
      isHomesteadOwner: false,
    },
  });
  await prisma.userRole.create({ data: { userId: created.id, role: PrismaRole.BUYER } });
  const withRoles = await prisma.user.findUnique({
    where: { id: created.id },
    include: { userRoles: true },
  });
  return withRoles ? dbUserToSessionUser(withRoles) : dbUserToSessionUser(created);
}

/** Derive role flags from userRoles (source of truth); fall back to legacy User columns if no roles. */
function dbUserToSessionUser(u: {
  id: string;
  email: string;
  name: string | null;
  role: "BUYER" | "PRODUCER" | "ADMIN" | "CAREGIVER" | "CARE_SEEKER";
  zipCode: string;
  primaryMode?: string | null;
  isProducer: boolean;
  isBuyer: boolean;
  isCaregiver: boolean;
  isHomesteadOwner: boolean;
  userRoles?: { role: string }[];
}): SessionUser {
  const roles = u.userRoles?.map((r) => r.role) ?? [];
  const isProducer = roles.includes("PRODUCER") || roles.includes("ADMIN") || u.isProducer;
  const isBuyer = roles.includes("BUYER") || u.isBuyer;
  const isCaregiver = roles.includes("CAREGIVER") || u.isCaregiver;
  const isHomesteadOwner = roles.includes("CARE_SEEKER") || u.isHomesteadOwner;
  const primaryRole: Role = roles.includes("ADMIN")
    ? "ADMIN"
    : roles.includes("PRODUCER")
      ? "PRODUCER"
      : u.role === "CAREGIVER" || u.role === "CARE_SEEKER"
        ? "BUYER"
        : (u.role as Role);
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: primaryRole,
    zipCode: u.zipCode,
    primaryMode: (u.primaryMode as PrimaryMode) ?? undefined,
    isProducer,
    isBuyer,
    isCaregiver,
    isHomesteadOwner,
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
    return syncClerkUserToDb(userId, email, name, clerkUser ?? undefined);
  }

  if (process.env.NODE_ENV === "development") {
    const cookieStore = await cookies();
    const devUserId = cookieStore.get("__dev_user_id")?.value;
    if (devUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: devUserId },
        include: { userRoles: true },
      });
      if (dbUser) {
        const session = dbUserToSessionUser(dbUser);
        const devZip = cookieStore.get("__dev_zip")?.value?.trim().slice(0, 5);
        if (devZip && /^\d{5}$/.test(devZip)) session.zipCode = devZip;
        return session;
      }
    }
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
  const canAccessProducer =
    user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;
  if (!canAccessProducer) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function requireCaregiverOrAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.isCaregiver !== true) throw new Error("Forbidden");
  return user;
}

export async function requireCareSeekerOrAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.isHomesteadOwner !== true) throw new Error("Forbidden");
  return user;
}
