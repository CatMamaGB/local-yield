/**
 * Market — product browse. Location-filtered; uses BrowseClient.
 */

import { BrowseClient } from "@/components/BrowseClient";
import { PageHeader } from "@/components/ui/PageHeader";

export default function MarketBrowsePage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader
          title="Browse local goods"
          subtitle="Set your location to see distance and nearby vs farther-out listings."
        />
        <div className="mt-8">
          <BrowseClient />
        </div>
      </section>
    </div>
  );
}
