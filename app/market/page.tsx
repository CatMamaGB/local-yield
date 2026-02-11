/**
 * Market landing — Rover-style hero + central Find vs Sell card.
 * Path: /market (one domain, two experiences: Market vs Care).
 */

import { getCurrentUser } from "@/lib/auth";
import { MarketSearchCard } from "@/components/MarketSearchCard";
import { RequestItemForm } from "@/components/RequestItemForm";

export default async function MarketLandingPage() {
  const user = await getCurrentUser();
  const isProducer =
    user?.role === "PRODUCER" || user?.role === "ADMIN";
  const defaultZip = user?.zipCode ?? "";

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Hero: Rover-style full-bleed with headline */}
      <section className="relative min-h-[40vh] overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand/90 via-brand/70 to-brand-accent/80">
        <div className="relative mx-auto flex min-h-[40vh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center text-white">
          <h1 className="font-display text-4xl font-bold tracking-tight drop-shadow sm:text-5xl md:text-6xl">
            Local goods from producers near you
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-white/95 drop-shadow sm:text-xl">
            Browse by location. Pick up or get delivered — no shipping. Selling? No booth fees, no full-day commitment.
          </p>
        </div>
      </section>

      {/* Central card — overlaps hero (Rover-style) */}
      <section className="relative z-10 mx-auto -mt-12 max-w-5xl px-4">
        <MarketSearchCard isProducer={isProducer} />
      </section>

      {/* Request an item */}
      <section className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-brand/20 bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-brand">Request an item</h2>
          <p className="mt-1 text-brand/80">
            Looking for something specific? Producers in your area can see it.
          </p>
          <div className="mt-4">
            <RequestItemForm defaultZip={defaultZip} />
          </div>
        </div>
      </section>
    </div>
  );
}
