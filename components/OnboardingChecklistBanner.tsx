"use client";

/**
 * OnboardingChecklistBanner — appears on dashboards when profile is incomplete.
 * Links to /dashboard/profile or /dashboard/settings so users can complete steps.
 * Makes "skip for now" feel finished by surfacing what's left to do.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/client/api-client";

export function OnboardingChecklistBanner() {
  const [incompleteSteps, setIncompleteSteps] = useState<string[] | null>(null);

  useEffect(() => {
    apiGet<{ incompleteSteps: string[] }>("/api/account/completion")
      .then((data) => {
        if (data?.incompleteSteps?.length) setIncompleteSteps(data.incompleteSteps);
      })
      .catch(() => {});
  }, []);

  if (!incompleteSteps?.length) return null;

  const message =
    incompleteSteps.length === 1 && incompleteSteps[0] === "zipCode"
      ? "Add ZIP to see results near you."
      : "Complete your profile to get the most out of your account.";

  return (
    <div
      className="rounded-xl border border-brand/20 bg-brand-light/50 px-4 py-3 text-sm text-brand"
      role="status"
    >
      <p className="font-medium">{message}</p>
      <p className="mt-1">
        <Link
          href="/dashboard/profile"
          className="font-semibold text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded"
        >
          Complete in Settings →
        </Link>
      </p>
    </div>
  );
}
