/**
 * The Local Yield — Rover-style "Choose your path" landing.
 * One domain, two experiences: Market (local goods) and Care (animal care).
 */

import Link from "next/link";
import Image from "next/image";
import { ShoppingBagIcon, HeartIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-light">
      {/* Hero: same visual language as Market / Care */}
      <section className="relative min-h-[45vh] overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand/90 via-brand/70 to-brand-accent/80">
        <div className="relative mx-auto flex min-h-[45vh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center text-white">
          <Image
            src="/local-yield-logo.png"
            alt=""
            width={80}
            height={80}
            priority
            className="rounded-xl opacity-95"
          />
          <h1 className="font-display mt-6 text-4xl font-bold tracking-tight drop-shadow sm:text-5xl md:text-6xl">
            The Local Yield
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-white/95 drop-shadow sm:text-xl">
            Your local marketplace. Choose your path:
          </p>
        </div>
      </section>

      {/* Central card — two paths (Rover-style) */}
      <section className="relative z-10 mx-auto -mt-12 max-w-3xl px-4">
        <div className="rounded-2xl border border-brand/15 bg-white p-6 shadow-xl sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <Link
              href="/market"
              className="flex flex-col items-center rounded-xl border-2 border-brand/20 bg-brand-light/50 p-6 text-center transition hover:border-brand hover:bg-brand-light"
            >
              <ShoppingBagIcon className="h-12 w-12 text-brand" aria-hidden />
              <span className="font-display mt-3 text-xl font-semibold text-brand">Market</span>
              <p className="mt-2 text-sm text-brand/80">
                Local goods from producers near you. Browse, pick up or get delivered.
              </p>
              <span className="mt-4 text-sm font-medium text-brand-accent">Browse Market →</span>
            </Link>
            <Link
              href="/care"
              className="flex flex-col items-center rounded-xl border-2 border-brand/20 bg-brand-light/50 p-6 text-center transition hover:border-brand hover:bg-brand-light"
            >
              <HeartIcon className="h-12 w-12 text-brand" aria-hidden />
              <span className="font-display mt-3 text-xl font-semibold text-brand">Care</span>
              <p className="mt-2 text-sm text-brand/80">
                Trusted animal care and homestead support in your neighborhood.
              </p>
              <span className="mt-4 text-sm font-medium text-brand-accent">Find Care →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Producer value: pain-led, not feature-led */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl border border-brand/20 bg-white p-6 text-center">
          <h2 className="font-display text-xl font-semibold text-brand">Sell without the hassle</h2>
          <p className="mt-2 text-brand/80">
            No booth fees. No full-day commitment. One place for online and in-person sales — keep more of what you earn.
          </p>
          <ul className="mt-4 space-y-1 text-sm text-brand/80">
            <li>Sell without paying for a booth</li>
            <li>Sell even when you can&apos;t attend the market</li>
            <li>One place for online and in-person sales</li>
            <li>Keep more of what you earn</li>
          </ul>
          <Link
            href="/market"
            className="mt-6 inline-block rounded-full border-2 border-brand px-6 py-2.5 font-medium text-brand hover:bg-brand-light"
          >
            See how it works
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <Link href="/about" className="text-brand/70 hover:text-brand-accent underline">
          Learn more about us and our goals
        </Link>
      </section>
    </div>
  );
}
