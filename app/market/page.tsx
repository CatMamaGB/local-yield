/**
 * Market landing — buyer-first: hero + primary search + request item + small producer CTA.
 * Path: /market (one platform, two experiences: Market vs Care).
 */

import Link from "next/link";
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
      {/* Hero + primary search: 2 cols on desktop, stacked on mobile */}
      <section className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand/90 via-brand/70 to-brand-accent/80 shadow-sm">
        <div className="relative mx-auto max-w-5xl px-4 py-10 md:py-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
            <div className="text-center md:text-left">
              <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl md:text-5xl">
                Find local goods near you
              </h1>
              <p className="mt-3 max-w-md text-base font-medium text-white/95 drop-shadow sm:text-lg md:mx-0 md:mt-4">
                Shop from nearby producers. Choose pickup or local delivery. No shipping.
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-md">
                <MarketSearchCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Request item section */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-14">
        <div className="rounded-xl border border-brand/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-brand leading-tight">
            Request an item
          </h2>
          <p className="mt-2 text-brand/80 leading-relaxed">
            Looking for something specific? Post a request and nearby producers can respond.
          </p>
          <div className="mt-4">
            <RequestItemForm defaultZip={defaultZip} />
          </div>
        </div>
      </section>

      {/* Producer CTA — secondary, smaller */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="rounded-xl border border-brand/10 bg-white/80 p-5 shadow-sm sm:p-6">
          <h3 className="font-display text-lg font-semibold text-brand/90 leading-tight">
            Are you a producer?
          </h3>
          <p className="mt-1.5 text-sm text-brand/80 leading-relaxed">
            Create a storefront and start taking preorders and local pickup.
          </p>
          {isProducer ? (
            <Link
              href="/dashboard"
              className="mt-3 inline-flex rounded-lg border border-brand/20 bg-white px-4 py-2 text-sm font-medium text-brand-accent transition hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/signup"
              className="mt-3 inline-flex rounded-lg border border-brand/20 bg-white px-4 py-2 text-sm font-medium text-brand-accent transition hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Start selling
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
