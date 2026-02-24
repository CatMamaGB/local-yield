/**
 * GET /api/auth/debug — development only. Returns currentUser and cookie names for debugging dev login.
 * In production always 404. In development optionally requires DEV_DEBUG=true.
 */

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok, fail } from "@/lib/api";
import { getRequestId } from "@/lib/request-id";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(null, { status: 404 });
  }
  if (process.env.DEV_DEBUG !== "true") {
    return NextResponse.json(null, { status: 404 });
  }
  try {
    const currentUser = await getCurrentUser();
    const cookieStore = await cookies();
    const cookieNames = ["__dev_user_id", "__dev_user", "__last_active_mode"];
    const cookieValues: Record<string, string | undefined> = {};
    for (const name of cookieNames) {
      cookieValues[name] = cookieStore.get(name)?.value;
    }
    return ok(
      {
        currentUser: currentUser
          ? { id: currentUser.id, email: currentUser.email, role: currentUser.role }
          : null,
        cookies: cookieValues,
      },
      requestId
    );
  } catch {
    return fail("Debug failed", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
