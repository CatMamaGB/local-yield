/**
 * Market landing — Care-style hero + central search card, then request item + producer CTA.
 * Path: /market (Market home; browse at /market/browse).
 */

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFeed } from "@/lib/feed";
import { MarketHomeSearchCard } from "@/components/MarketHomeSearchCard";
import { RequestItemForm } from "@/components/RequestItemForm";
import { CommunityFeedSection } from "@/components/CommunityFeedSection";

export default async function MarketLandingPage() {
  const user = await getCurrentUser();
  const isProducer =
    user?.role === "PRODUCER" || user?.role === "ADMIN";
  const defaultZip = user?.zipCode ?? "";
  const feed = defaultZip ? await getFeed(defaultZip, 25) : null;

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Hero — Care-style */}
      <section className="relative min-h-[50vh] overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand/90 via-brand/70 to-brand-accent/80 shadow-farmhouse">
        <div className="relative mx-auto flex min-h-[50vh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center text-white md:items-start md:text-left">
          <h1 className="font-display text-4xl font-bold tracking-tight drop-shadow sm:text-5xl md:text-6xl">
            Find local goods near you
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-white/95 drop-shadow sm:text-xl">
            Shop from nearby producers. Choose pickup or local delivery. No shipping.
          </p>
          <p className="mt-2 text-sm font-medium text-white/90 drop-shadow md:text-base">
            Browse by category or location. One trip, many items.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              Local producers
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              Pickup & delivery
            </span>
          </div>
        </div>
      </section>

      {/* Central search card — overlaps hero */}
      <section className="relative z-10 mx-auto -mt-12 max-w-5xl px-4">
        <MarketHomeSearchCard />
      </section>

      {/* Community feed (when zip available) */}
      {defaultZip && feed && (
        <section className="mx-auto max-w-5xl px-4 pt-8">
          <CommunityFeedSection feed={feed} zip={defaultZip} />
        </section>
      )}

      {/* Request item section — discovery first, then escape hatch */}
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
