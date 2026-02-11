/**
 * Onboarding: role selection + ZIP code. Shown after sign-up or when zip not set (dev mode).
 * When Clerk is configured, redirect to dashboard if already has zip.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (user.zipCode && user.zipCode !== "00000") {
    redirect(user.role === "PRODUCER" ? "/dashboard" : "/market/browse");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <OnboardingClient />
    </div>
  );
}
