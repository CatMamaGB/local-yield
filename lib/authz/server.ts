/**
 * Server-only authorization helpers.
 * For client-safe helpers, import directly from lib/authz/client.ts
 * 
 * This file only exports requireCapability which is server-only.
 * Client components should import getUserCapabilities, etc. from lib/authz/client.ts
 */

import { NextResponse } from "next/server";
import { fail } from "../api";
import type { SessionUser } from "../auth/types";
import type { UserCapabilities } from "./client";

/**
 * Require a capability. Returns structured response instead of throwing.
 * Use in API routes: const authz = await requireCapability("canSell"); if (!authz.ok) return authz.response;
 */
export async function requireCapability(
  capability: keyof UserCapabilities
): Promise<{ ok: true; user: SessionUser } | { ok: false; response: NextResponse }> {
  // Dynamic import to avoid pulling server-only code into client bundles
  const { getCurrentUser } = await import("../auth/server");
  const { getUserCapabilities } = await import("./client");
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 }),
    };
  }

  const capabilities = getUserCapabilities(user);
  if (!capabilities[capability]) {
    return {
      ok: false,
      response: fail("Forbidden", { code: "FORBIDDEN", status: 403 }),
    };
  }

  return { ok: true, user };
}