/**
 * Market landing — browse categories, how it works.
 * Path: /market (one domain, two experiences: Market vs Care).
 */

import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { RequestItemForm } from "@/components/RequestItemForm";

export default async function MarketLandingPage() {
  const user = await getCurrentUser();
  const defaultZip = user?.zipCode ?? "";
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Image
          src="/local-yield-logo.png"
          alt="The Local Yield — Market"
          width={100}
          height={100}
          priority
          className="mx-auto rounded-2xl"
        />
        <h1 className="font-display mt-6 text-4xl font-bold tracking-tight text-brand sm:text-5xl">
          Market
        </h1>
        <p className="mt-4 text-lg text-brand/80">
          Local goods from producers near you. Browse by location, pick up or get delivered — no shipping.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/market/browse"
            className="rounded-full bg-brand px-8 py-3 font-medium text-white transition hover:bg-brand/90"
          >
            Browse local goods
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-full border-2 border-brand px-8 py-3 font-medium text-brand transition hover:bg-brand/10"
          >
            Sign up to sell
          </Link>
        </div>
        <section className="mt-16 grid gap-6 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-brand/20 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-brand">For buyers</h2>
            <p className="mt-2 text-brand/80">
              Set your ZIP, browse producers near you, and choose pickup or delivery. Pay with card or cash.
            </p>
          </div>
          <div className="rounded-xl border border-brand/20 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-brand">For producers</h2>
            <p className="mt-2 text-brand/80">
              List your goods, weekly veggie boxes, and events. Manage orders and subscriptions from your dashboard.
            </p>
          </div>
        </section>
        <section className="mt-12 rounded-xl border border-brand/20 bg-white p-6 text-left">
          <h2 className="font-display text-xl font-semibold text-brand">Request an item</h2>
          <p className="mt-1 text-brand/80">
            Looking for something specific? Post a request — producers in your area will see it.
          </p>
          <div className="mt-4">
            <RequestItemForm defaultZip={defaultZip} />
          </div>
        </section>
      </main>
    </div>
  );
}
