/**
 * Market — product browse. Location-filtered; uses BrowseClient.
 * Path: /market/browse (Market vs Care mental model).
 */

import { BrowseClient } from "@/components/BrowseClient";

export default function MarketBrowsePage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-brand">
          Browse local goods
        </h1>
        <p className="mt-2 text-brand/80">
          Set your location to see distance and nearby vs farther-out listings.
        </p>
        <div className="mt-8">
          <BrowseClient />
        </div>
      </section>
    </div>
  );
}
