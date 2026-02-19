/**
 * The Local Yield — Homepage.
 * Calm, neighborly. Local goods and farm care — close to home.
 */

import Link from "next/link";
import { ShoppingBagIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HomeFAQ } from "@/components/HomeFAQ";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-light">
      {/* HERO */}
      <section className="relative min-h-[40vh] overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand/90 via-brand/70 to-brand-accent/80 shadow-farmhouse" aria-labelledby="hero-heading">
        <div className="relative mx-auto flex min-h-[40vh] max-w-3xl flex-col items-center justify-center px-4 py-14 text-center text-white">
          <h1 id="hero-heading" className="font-display text-4xl font-bold tracking-tight drop-shadow sm:text-5xl leading-tight">
            Local goods and trusted farm care — close to home.
          </h1>
          <p className="mt-3 max-w-3xl text-lg font-medium text-white/95 drop-shadow leading-relaxed">
            Shop from nearby farmers, makers, and artists. Book reliable help for livestock and homestead work. The Local Yield keeps community commerce simple and local.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/market"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand shadow-farmhouse transition hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-accent"
            >
              Browse Market
            </Link>
            <Link
              href="/care/browse"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white/90 bg-transparent px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-accent"
            >
              Find Care
            </Link>
          </div>
          <p className="mt-5">
            <Link
              href="/auth/signup"
              className="text-sm font-medium text-white/90 underline hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-accent rounded"
            >
              Sell goods or offer care →
            </Link>
          </p>
        </div>
      </section>

      {/* SECTION 2 — What This Is */}
      <section className="mx-auto max-w-3xl px-4 py-10" aria-labelledby="what-this-is-heading">
        <h2 id="what-this-is-heading" className="font-display text-2xl font-semibold text-brand text-center">
          One place for local goods and farm support.
        </h2>
        <div className="mt-6 space-y-4 text-brand/90 leading-relaxed text-center">
          <p>
            The Local Yield brings your community together in one simple platform.
          </p>
          <p>
            Buy food, art, and handmade goods from nearby producers.<br />
            Find dependable help for livestock and homestead tasks.
          </p>
          <p className="font-medium text-brand">
            Everything stays local. Everything stays human.
          </p>
        </div>
      </section>

      {/* SECTION 3 — Two Clear Paths */}
      <section className="mx-auto max-w-5xl px-4 py-8" aria-labelledby="two-paths-heading">
        <h2 id="two-paths-heading" className="sr-only">Two clear paths</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            href="/market/browse"
            className="flex flex-col rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse transition hover:border-brand-accent/40 hover:shadow-farmhouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-light"
          >
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-brand-accent" aria-hidden />
            <h3 className="font-display mt-3 text-xl font-semibold text-brand">Market</h3>
            <p className="mt-3 text-sm text-brand/80 leading-relaxed">
              Browse goods from farmers, makers, and artists near you. Order online. Pick up locally or arrange delivery. No shipping warehouses. No middlemen.
            </p>
            <span className="mt-5 text-sm font-medium text-brand-accent">Browse Market →</span>
          </Link>
          <Link
            href="/care/browse"
            className="flex flex-col rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse transition hover:border-brand-accent/40 hover:shadow-farmhouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-light"
          >
            <HeartIcon className="mx-auto h-12 w-12 text-brand-accent" aria-hidden />
            <h3 className="font-display mt-3 text-xl font-semibold text-brand">Care</h3>
            <p className="mt-3 text-sm text-brand/80 leading-relaxed">
              Find trusted help for animals and homestead work. Search by location, species, or service type. Request care, message directly, and agree on details together.
            </p>
            <span className="mt-5 text-sm font-medium text-brand-accent">Find Care →</span>
          </Link>
        </div>
      </section>

      {/* SECTION 4 — How It Works */}
      <section className="mx-auto max-w-5xl px-4 py-10" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="font-display text-2xl font-semibold text-brand text-center mb-8">
          How it works
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
            <h3 className="font-display text-lg font-semibold text-brand">Market</h3>
            <ol className="mt-4 space-y-3 text-sm text-brand/90 list-none pl-0">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent font-semibold text-xs" aria-hidden>1</span>
                <span>Browse by ZIP code</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent font-semibold text-xs" aria-hidden>2</span>
                <span>Order from local producers</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent font-semibold text-xs" aria-hidden>3</span>
                <span>Pick up or receive locally</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent font-semibold text-xs" aria-hidden>4</span>
                <span>Leave a simple, fair review</span>
              </li>
            </ol>
            <p className="mt-4 text-sm text-brand/70 italic">
              Everything happens close to home — no shipping, no complexity.
            </p>
            <Link href="/market/browse" className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded">
              Browse Market
            </Link>
          </div>
          <div className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
            <h3 className="font-display text-lg font-semibold text-brand">Care</h3>
            <ol className="mt-4 space-y-3 text-sm text-brand/90 list-none pl-0">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent font-semibold text-xs" aria-hidden>1</span>
                <span>Search caregivers near you</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent font-semibold text-xs" aria-hidden>2</span>
                <span>Request care with your dates and needs</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent font-semibold text-xs" aria-hidden>3</span>
                <span>Agree on details directly</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent font-semibold text-xs" aria-hidden>4</span>
                <span>Complete the booking with clarity</span>
              </li>
            </ol>
            <p className="mt-4 text-sm text-brand/70 italic">
              Built for livestock owners, homesteads, and rural families.
            </p>
            <Link href="/care/browse" className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded">
              Find Care
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Who Can Join */}
      <section className="mx-auto max-w-3xl px-4 py-10" aria-labelledby="who-can-join-heading">
        <div className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse sm:p-8">
          <h2 id="who-can-join-heading" className="font-display text-xl font-semibold text-brand">
            Who can join?
          </h2>
          <p className="mt-3 text-brand/90 leading-relaxed">
            Farmers. Gardeners. Bakers. Artists. Woodworkers. Soap makers. Ranchers. Homesteaders.
          </p>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Anyone creating real goods or offering real, local services.
          </p>
          <p className="mt-4 text-brand/90 leading-relaxed">
            To sell or offer care on The Local Yield, you must:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-brand/90 leading-relaxed">
            <li>Follow your local laws and food safety requirements</li>
            <li>Accurately describe what you’re selling</li>
            <li>Respect your customers and community</li>
          </ul>
          <p className="mt-4 text-brand/90 leading-relaxed">
            We provide guidance and structure — but you are responsible for your own compliance.
          </p>
          <Link href="/seller-guidelines" className="mt-5 inline-flex items-center text-sm font-medium text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded">
            View Seller Guidelines →
          </Link>
        </div>
      </section>

      {/* SECTION 6 — Trust & Fairness */}
      <section className="mx-auto max-w-3xl px-4 py-10" aria-labelledby="trust-heading">
        <div className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse sm:p-8">
          <h2 id="trust-heading" className="font-display text-xl font-semibold text-brand">
            Built on fairness and clarity.
          </h2>
          <p className="mt-3 text-brand/90 leading-relaxed">
            Reviews are structured and moderated. Negative feedback includes a resolution window. Care bookings create clear agreements.
          </p>
          <p className="mt-4 text-brand/90 leading-relaxed font-medium">
            This is not an anonymous marketplace. It’s a trust network built for neighbors.
          </p>
        </div>
      </section>

      {/* SECTION 7 — FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-display text-2xl font-semibold text-brand text-center mb-8">
          Frequently asked questions
        </h2>
        <HomeFAQ />
      </section>

      {/* SECTION 8 — Closing Statement */}
      <section className="mx-auto max-w-3xl px-4 py-12 text-center" aria-labelledby="closing-heading">
        <h2 id="closing-heading" className="font-display text-2xl font-semibold text-brand">
          Keep commerce close to home.
        </h2>
        <p className="mt-4 text-brand/90 leading-relaxed">
          When you buy locally, money stays local. When you find help locally, relationships grow.
        </p>
        <p className="mt-2 text-brand/90 leading-relaxed">
          The Local Yield exists to make that simple.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/market"
            className="inline-flex items-center justify-center rounded-lg border-2 border-brand-accent bg-white px-6 py-3 text-base font-semibold text-brand-accent transition hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            Browse Market
          </Link>
          <Link
            href="/care/browse"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            Find Care
          </Link>
        </div>
      </section>
    </div>
  );
}
