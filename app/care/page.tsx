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
        <div className="relative mx-auto flex min-h-[50vh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center text-white md:items-start md:text-left">
          <h1 className="font-display text-4xl font-bold tracking-tight drop-shadow sm:text-5xl md:text-6xl">
            Farm and homestead help from people nearby
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-white/95 drop-shadow sm:text-xl">
            Book trusted care for animals, barns, and small farm projects. Local, flexible, and built for real farm life.
          </p>
          <p className="mt-2 text-sm font-medium text-white/90 drop-shadow md:text-base">
            Post what you need. Choose a helper. Keep it local.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              Profiles and reviews
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              Local-first matching
            </span>
          </div>
        </div>
      </section>

      {/* Central search card — overlaps hero */}
      <section className="relative z-10 mx-auto -mt-12 max-w-5xl px-4">
        <CareSearchCard />
      </section>

      {/* Two big cards: Offer help (Helper) and Find help (Hire) — single Care surface */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-2xl font-semibold text-brand text-center mb-8">
          How do you want to use Care?
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border-2 border-brand/20 bg-white p-6 shadow-farmhouse sm:p-8 transition hover:border-brand-accent/40">
            <h3 className="font-display text-xl font-semibold text-brand">
              Offer help
            </h3>
            <p className="mt-3 text-brand/90 leading-relaxed">
              Animal care and barn chores: livestock, small animals, feed and turnout, stall cleanup, and overnight farm coverage. Offer your services to neighbors and get booked locally.
            </p>
            <Link
              href="/care/browse"
              className="mt-5 inline-block rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Browse as a helper
            </Link>
          </div>
          <div className="rounded-xl border-2 border-brand/20 bg-white p-6 shadow-farmhouse sm:p-8 transition hover:border-brand-accent/40">
            <h3 className="font-display text-xl font-semibold text-brand">
              Find help
            </h3>
            <p className="mt-3 text-brand/90 leading-relaxed">
              Small farm projects and jobs: fence and repairs, garden and harvest help, light equipment work. Post what you need and choose a local helper for your homestead.
            </p>
            <Link
              href="/care/post-job"
              className="mt-5 inline-block rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Post a job
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 text-center">
        <p className="text-brand/80">
          Want to help?{" "}
          <Link href="/auth/signup" className="font-semibold text-brand-accent hover:underline">
            Become a helper
          </Link>
        </p>
      </section>

    </div>
  );
}
