/**
 * Care landing — hero + central search card.
 * Path: /care (one platform, two experiences: Market vs Care).
 */

import Link from "next/link";
import { CareSearchCard } from "@/components/CareSearchCard";

export default function CareLandingPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <section className="relative min-h-[50vh] overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand/90 via-brand/70 to-brand-accent/80 shadow-farmhouse">
        <div className="relative mx-auto flex min-h-[50vh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center text-white">
          <h1 className="font-display text-4xl font-bold tracking-tight drop-shadow sm:text-5xl md:text-6xl">
            Trusted animal care in your neighborhood
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-white/95 drop-shadow sm:text-xl">
            Book caregivers and sitters near you.
          </p>
        </div>
      </section>

      {/* Central search card — overlaps hero */}
      <section className="relative z-10 mx-auto -mt-12 max-w-5xl px-4">
        <CareSearchCard />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 text-center">
        <p className="text-brand/80">
          Want to offer care?{" "}
          <Link href="/auth/signup" className="font-semibold text-brand-accent hover:underline">
            Become a caregiver
          </Link>
        </p>
      </section>

    </div>
  );
}
