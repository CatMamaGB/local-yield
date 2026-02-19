/**
 * POST /api/dev/reset-onboarding — Dev-only. Clears onboarding state for the current user
 * so you can re-run the onboarding flow. Requires __dev_user_id cookie (dev auth).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return fail("Not available", { code: "NOT_AVAILABLE", status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const clearZip = Boolean(body?.clearZip);

    const updateData: {
      termsAcceptedAt: null;
      onboardingCompletedAt: null;
      onboardedAt: null;
      zipCode?: null;
    } = {
      termsAcceptedAt: null,
      onboardingCompletedAt: null,
      onboardedAt: null,
    };
    if (clearZip) {
      updateData.zipCode = null;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData as Parameters<typeof prisma.user.update>[0]["data"],
    });

    return ok({ message: "Onboarding state reset. Revisit /auth/onboarding to test." });
  } catch (e) {
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500 });
  }
}
