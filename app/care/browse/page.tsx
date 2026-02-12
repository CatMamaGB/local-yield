/**
 * Care — browse caregivers. Placeholder for later.
 * Path: /care/browse (when Care is launched).
 * When Care is disabled (feature flag), redirects to /market.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { isCareEnabled } from "@/lib/feature-flags";

export default function CareBrowsePage() {
  if (!isCareEnabled()) redirect("/market");
  return (
    <div className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/care" className="text-brand-accent hover:underline">
          ← Back to Care
        </Link>
        <h1 className="font-display mt-4 text-3xl font-semibold text-brand">
          Browse caregivers
        </h1>
        <p className="mt-2 text-brand/80">
          Coming soon. You’ll be able to find and book local caregivers here.
        </p>
      </section>
    </div>
  );
}
