/**
 * Location-filtered shopping browse page.
 * TODO: Wire to ZIP/radius filter and product list from DB.
 */

import { LocationInput } from "@/components/LocationInput";
import { ProductCard } from "@/components/ProductCard";

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-brand">Browse local goods</h1>
        <p className="mt-2 text-brand/80">
          Set your location to see products and producers near you.
        </p>
        <div className="mt-6">
          <LocationInput />
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder; replace with data from API/DB */}
          <ProductCard
            id="1"
            title="Sample produce"
            description="Local organic example."
            price={5.99}
            imageUrl={null}
            category="Produce"
            delivery={false}
            pickup={true}
          />
        </div>
      </section>
    </div>
  );
}
