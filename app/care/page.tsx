/**
 * Care landing — Rover-style hero + central search card.
 * Path: /care (one domain, two experiences: Market vs Care).
 * When Care isn't launched: same layout with "Coming soon" card and waitlist.
 */

import Link from "next/link";
import { isCareEnabled } from "@/lib/feature-flags";
import { CareSearchCard } from "@/components/CareSearchCard";

export default function CareLandingPage() {
  const careEnabled = isCareEnabled();

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Hero: Rover-style full-bleed with headline overlay */}
      <section className="relative min-h-[50vh] overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand/90 via-brand/70 to-brand-accent/80">
        <div className="relative mx-auto flex min-h-[50vh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center text-white">
          <h1 className="font-display text-4xl font-bold tracking-tight drop-shadow sm:text-5xl md:text-6xl">
            Trusted animal care in your neighborhood
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-white/95 drop-shadow sm:text-xl">
            Book caregivers and sitters near you.
          </p>
        </div>
      </section>

      {/* Central search card — overlaps hero (Rover-style) */}
      <section className="relative z-10 mx-auto -mt-12 max-w-5xl px-4">
        {careEnabled ? (
          <CareSearchCard />
        ) : (
          <div className="w-full max-w-2xl rounded-2xl border border-brand/15 bg-white p-6 shadow-xl">
            <p className="text-center font-display text-lg font-semibold text-brand">
              Care is coming soon
            </p>
            <p className="mt-2 text-center text-brand/80">
              Join the waitlist to be first. One account for Market and Care.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <span className="rounded-full bg-brand/80 px-6 py-2.5 font-medium text-white">
                Coming soon
              </span>
              <Link
                href="/"
                className="rounded-full border-2 border-brand px-6 py-2.5 font-medium text-brand transition hover:bg-brand/10"
              >
                Back to home
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Secondary CTA: Become a Caregiver */}
      <section className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-brand/80">
          Want to offer care?{" "}
          <Link href="/auth/signup" className="font-semibold text-brand-accent hover:underline">
            Become a caregiver
          </Link>
        </p>
      </section>

      {!careEnabled && (
        <section className="mx-auto max-w-2xl px-4 pb-16">
          <div className="rounded-xl border border-brand/20 bg-white p-6 text-left">
            <h2 className="font-display text-xl font-semibold text-brand">What&apos;s Care?</h2>
            <p className="mt-2 text-brand/80">
              Care will let you browse local caregivers, book support, and connect with your
              community — all on the same Local Yield account you use for Market.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
