/**
 * Care landing — gated or "coming soon".
 * Path: /care (one domain, two experiences: Market vs Care).
 * When Care isn't launched: show Coming Soon + waitlist; can be feature-flagged.
 */

import Link from "next/link";
import Image from "next/image";

export default function CareLandingPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Image
          src="/local-yield-logo.png"
          alt="The Local Yield — Care"
          width={100}
          height={100}
          priority
          className="mx-auto rounded-2xl"
        />
        <h1 className="font-display mt-6 text-4xl font-bold tracking-tight text-brand sm:text-5xl">
          Care
        </h1>
        <p className="mt-4 text-lg text-brand/80">
          Find local caregivers and support. Coming soon — join the waitlist to be first.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <span className="rounded-full bg-brand/70 px-8 py-3 font-medium text-white cursor-not-allowed">
            Coming soon
          </span>
          <Link
            href="/"
            className="rounded-full border-2 border-brand px-8 py-3 font-medium text-brand transition hover:bg-brand/10"
          >
            Back to home
          </Link>
        </div>
        <section className="mt-16 rounded-xl border border-brand/20 bg-white p-8 text-left">
          <h2 className="font-display text-xl font-semibold text-brand">What’s Care?</h2>
          <p className="mt-2 text-brand/80">
            Care will let you browse local caregivers, book support, and connect with your community — all on the same Local Yield account you use for Market.
          </p>
        </section>
      </main>
    </div>
  );
}
