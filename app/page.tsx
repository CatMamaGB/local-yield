/**
 * The Local Yield — "Choose your path" landing.
 * One domain, two experiences: Market (local goods) and Care (coming soon).
 */

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Image
          src="/local-yield-logo.png"
          alt="The Local Yield"
          width={120}
          height={120}
          priority
          className="mx-auto rounded-2xl"
        />
        <h1 className="font-display mt-8 text-4xl font-bold tracking-tight text-brand sm:text-5xl">
          The Local Yield
        </h1>
        <p className="mt-4 text-lg text-brand/80">
          Your local marketplace. Choose your path:
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/market"
            className="rounded-2xl border-2 border-brand bg-white p-8 font-display text-xl font-semibold text-brand transition hover:border-brand-accent hover:bg-brand-light"
          >
            Market
          </Link>
          <Link
            href="/care"
            className="rounded-2xl border-2 border-brand/30 bg-white p-8 font-display text-xl font-semibold text-brand transition hover:border-brand hover:bg-brand-light"
          >
            Care
          </Link>
        </div>
        <p className="mt-6 text-sm text-brand/70">
          <Link href="/about" className="text-brand-accent underline hover:no-underline">
            Learn more about us and our goals
          </Link>
        </p>
        <section className="mt-20 grid gap-8 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-brand/20 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-brand">Market</h2>
            <p className="mt-2 text-brand/80">
              Local goods from producers near you. Browse by location, pick up or get delivered — no shipping.
            </p>
            <Link href="/market/browse" className="mt-3 inline-block text-brand-accent font-medium hover:underline">
              Browse local goods →
            </Link>
          </div>
          <div className="rounded-xl border border-brand/20 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-brand">Care</h2>
            <p className="mt-2 text-brand/80">
              Find local caregivers and support. Coming soon — one account for Market and Care.
            </p>
            <Link href="/care" className="mt-3 inline-block text-brand-accent font-medium hover:underline">
              Learn about Care →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
