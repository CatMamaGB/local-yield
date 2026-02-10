/**
 * Care — caregiver profile. Placeholder for later.
 * Path: /care/caregiver/[id] (when Care is launched).
 * When Care is disabled (feature flag), redirects to /care.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { isCareEnabled } from "@/lib/feature-flags";

interface CaregiverPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaregiverPage({ params }: CaregiverPageProps) {
  if (!isCareEnabled()) redirect("/care");
  const { id } = await params;
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/care/browse" className="text-brand-accent hover:underline">
          ← Back to caregivers
        </Link>
        <h1 className="font-display mt-4 text-3xl font-semibold text-brand">
          Caregiver profile
        </h1>
        <p className="text-brand/80">Caregiver ID: {id} — Coming soon.</p>
      </div>
    </div>
  );
}
