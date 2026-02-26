/**
 * Auth helpers for The Local Yield.
 * When Clerk is configured: use auth() + currentUser(), sync user to DB by clerkId.
 * When not: dev stub (__dev_user cookie) or null for unauthenticated.
 * 
 * This file is server-only. Do not import from client components.
 * For types, use lib/auth/types.ts
 */

import { auth as clerkAuth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { prisma } from "../prisma";
import { PlatformUse, Role as PrismaRole } from "@prisma/client";
import type { Role } from "@local-yield/shared/types";
import type { PrimaryMode } from "../redirects";
import type { SessionUser } from "./types";

/** No fake ZIP; when missing we keep null and show "Add ZIP" in UI. */

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
 * For new users, zipCode is null until set in onboarding or profile.
 * Clerk metadata can be checked here if ZIP is stored in publicMetadata/unsafeMetadata.
 */
async function syncClerkUserToDb(
  clerkId: string,
  email: string,
  name: string | null,
  clerkUser?: { publicMetadata?: Record<string, unknown>; unsafeMetadata?: Record<string, unknown> }
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
    
    if (zipFromClerk) {
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
  
  type CreateData = Parameters<typeof prisma.user.create>[0]["data"];
  const created = await prisma.user.create({
    data: {
      clerkId,
      email: emailSafe,
      name: name ?? null,
      phone: "",
      ...(zipFromClerk != null ? { zipCode: zipFromClerk } : {}),
      platformUse: PlatformUse.OTHER,
      role: PrismaRole.BUYER,
      isBuyer: true,
      isProducer: false,
      isCaregiver: false,
      isHomesteadOwner: false,
    } as CreateData,
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
  zipCode: string | null;
  primaryMode?: string | null;
  termsAcceptedAt?: Date | null;
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
    zipCode: u.zipCode ?? null,
    primaryMode: (u.primaryMode as PrimaryMode) ?? undefined,
    termsAcceptedAt: u.termsAcceptedAt ?? undefined,
    isProducer,
    isBuyer,
    isCaregiver,
    isHomesteadOwner,
  };
}

/**
 * Extract Bearer token from Authorization header.
 * Returns token string or null.
 */
async function extractBearerToken(): Promise<string | null> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.replace("Bearer ", "").trim() || null;
}

/**
 * Verify Clerk JWT token from Authorization header.
 * Returns userId or null if token invalid.
 * 
 * Uses Clerk's authenticateRequest to verify token signature and expiration.
 * This method handles:
 * - JWT signature verification
 * - Expiration checking
 * - Token claims validation
 * 
 * Note: For Next.js API routes, Clerk's auth() helper handles cookies automatically.
 * This function is specifically for verifying Bearer tokens from mobile apps.
 */
async function verifyClerkToken(token: string): Promise<string | null> {
  if (!isClerkConfigured()) return null;
  try {
    const client = await clerkClient();
    // Create a Request object with Authorization header for Clerk to verify
    // Clerk's authenticateRequest expects a Request object and extracts the token
    const mockRequest = new Request("https://api.localyield.example", {
      headers: { 
        Authorization: `Bearer ${token}`,
        // Clerk may also check for other headers, but Authorization is primary
      },
    });
    const authResult = await client.authenticateRequest(mockRequest);
    if (!authResult.isAuthenticated) return null;
    const auth = authResult.toAuth();
    return auth?.userId ?? null;
  } catch (error) {
    // Token invalid, expired, malformed, or verification failed
    // Log in development for debugging, but don't expose details
    if (process.env.NODE_ENV === "development") {
      console.error("Clerk token verification failed:", error);
    }
    return null;
  }
}

/**
 * Get user from token (for mobile/API clients).
 * Supports Clerk JWT tokens (verified with signature) and dev tokens (development only).
 * 
 * IMPORTANT: Clerk tokens are verified using Clerk's authenticateRequest() which:
 * - Verifies JWT signature
 * - Checks expiration
 * - Validates token claims
 * 
 * Dev tokens are simple strings (dev:userId) and only work in development.
 */
async function getUserFromToken(token: string): Promise<SessionUser | null> {
  // Try Clerk JWT token first (production)
  if (isClerkConfigured()) {
    const userId = await verifyClerkToken(token);
    if (userId) {
      // Token auth has no cookies; fetch user by token-derived userId from Clerk
      const client = await clerkClient();
      let clerkUser: Awaited<ReturnType<typeof client.users.getUser>> | null = null;
      try {
        clerkUser = await client.users.getUser(userId);
      } catch {
        // User may have been deleted in Clerk; sync will use fallbacks
      }
      const primaryEmail = clerkUser?.primaryEmailAddressId
        ? clerkUser.emailAddresses?.find((e) => e.id === clerkUser!.primaryEmailAddressId)?.emailAddress
        : undefined;
      const email = primaryEmail ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";
      const name =
        clerkUser?.firstName || clerkUser?.lastName
          ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null
          : (clerkUser?.username as string | null) ?? null;
      const dbUser = await syncClerkUserToDb(userId, email, name, clerkUser ?? undefined);
      
      // CRITICAL: Always reload from DB to ensure capabilities are current
      // Token may say "producer" but DB is source of truth
      if (dbUser) {
        const freshUser = await prisma.user.findUnique({
          where: { id: dbUser.id },
          include: { userRoles: true },
        });
        if (freshUser) {
          return dbUserToSessionUser(freshUser);
        }
      }
      return dbUser;
    }
    // Token invalid or expired - return null
    return null;
  }

  // Dev token support (development/testing only)
  if (process.env.NODE_ENV === "development") {
    // Simple dev token: format "dev:userId" or just userId
    // NOTE: These are NOT signed and should NEVER be used in production
    const devUserId = token.startsWith("dev:") ? token.slice(4) : token;
    const dbUser = await prisma.user.findUnique({
      where: { id: devUserId },
      include: { userRoles: true },
    });
    if (dbUser) {
      return dbUserToSessionUser(dbUser);
    }
  }

  return null;
}

/**
 * Get current user from session. Returns null when not signed in (Clerk) or when using stub and no dev cookie.
 * Supports both token-based (Bearer) and cookie-based (web) authentication.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // Try token first (for mobile/API clients)
  const token = await extractBearerToken();
  if (token) {
    const user = await getUserFromToken(token);
    if (user) return user;
    // If token fails, fall through to cookie-based auth
  }

  // Cookie-based auth (for web)
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

// Re-export types for convenience
export type { SessionUser } from "./types";