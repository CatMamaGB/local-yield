/**
 * Onboarding: terms + ZIP + roles. Shown until terms accepted; ZIP can be skipped (gentle prompt later).
 * Respects next= for post-onboarding redirect.
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getPostLoginRedirect, sanitizeNextPath } from "@/lib/redirects";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (user.termsAcceptedAt) {
    const cookieStore = await cookies();
    const lastActiveMode = cookieStore.get("__last_active_mode")?.value ?? null;
    const rawNext = (await searchParams).next;
    const requestedUrl = sanitizeNextPath(rawNext);
    redirect(getPostLoginRedirect(lastActiveMode, { requestedUrl: requestedUrl ?? undefined }));
  }
  return <OnboardingClient />;
}
