/**
 * The Local Yield — landing page.
 * Phase 1: Marketplace for local goods (no shipping).
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
          Your marketplace for local goods. Browse by location, pick up or get delivered — no shipping.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/browse"
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
        <section className="mt-20 grid gap-8 text-left sm:grid-cols-2">
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
      </main>
    </div>
  );
}
