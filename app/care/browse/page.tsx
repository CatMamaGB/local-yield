/**
 * Care — browse helpers (caregivers). Reads zip, radius, category from URL.
 */

import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { CareBrowseClient } from "./CareBrowseClient";

export default function CareBrowsePage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/care" className="text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded">
          ← Back to Care
        </Link>
        <PageHeader
          title="Browse helpers"
          subtitle="Find trusted farm and homestead help near you. Search by ZIP code and filter by species or service type."
          className="mt-4"
        />
        <div className="mt-8">
          <Suspense fallback={<div className="text-brand/70">Loading…</div>}>
            <CareBrowseClient />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
