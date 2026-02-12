/**
 * Onboarding: single place for roles (multi-select) + ZIP. Shown after sign-in/sign-up until complete.
 * Both Clerk and dev mode always route through here after successful authentication.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPostOnboardingRedirect } from "@/lib/redirects";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (user.zipCode && user.zipCode !== "00000") {
    redirect(getPostOnboardingRedirect(user));
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <OnboardingClient />
    </div>
  );
}
