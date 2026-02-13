/**
 * The Local Yield — About / Mission page.
 * Who we are, our goals, two phases, and how we solve the problem.
 */

import Link from "next/link";

export const metadata = {
  title: "About | The Local Yield",
  description:
    "The Local Yield strengthens small-scale farming and local production by connecting producers and consumers in their own communities.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl">
          About The Local Yield
        </h1>
        <p className="mt-4 text-lg text-brand/90">
          The Local Yield is a local-first platform designed to strengthen small-scale farming,
          homesteading, and local production by connecting producers, caregivers, and consumers
          within their own communities.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-brand">Two phases</h2>
          <p className="mt-2 text-brand/90">
            The platform launches in two intentional phases:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-brand/90">
            <li>
              <strong className="text-brand">The Local Yield Market</strong> — a true goods-based
              marketplace that functions as a digital, always-accessible farmers market.
            </li>
            <li>
              <strong className="text-brand">The Local Yield Care</strong> — structured farm animal
              care and rural labor support, not a gig app. Designed for homesteads, livestock, and
              rural communities.
            </li>
          </ul>
          <p className="mt-4 text-brand/90">
            The phased approach reduces risk, builds trust and local participation, and creates a
            sustainable foundation before expanding into higher-trust care services.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-brand">Who we’re for</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-brand/90">
            <li>Small-scale farmers and homesteaders</li>
            <li>Local makers and artists producing goods at small or micro scale</li>
            <li>Consumers seeking access to local products outside in-person market constraints</li>
            <li>Experienced animal caregivers and homestead helpers (The Local Yield Care)</li>
          </ul>
          <p className="mt-4 text-brand/90">
            The platform is intentionally designed for producers who may be too small, too busy, or
            too resource-constrained to consistently participate in traditional farmers markets.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-brand">The problem we solve</h2>
          <p className="mt-2 text-brand/90">
            While many regions have farmers markets—some seasonal, some year-round—access is limited.
          </p>
          <p className="mt-4 text-brand/90">
            <strong className="text-brand">Producers</strong> face limited booth availability, booth
            and equipment costs, time and labor requirements, and inconsistent ability to attend
            markets.
          </p>
          <p className="mt-2 text-brand/90">
            <strong className="text-brand">Consumers</strong> who want local products often cannot
            attend markets due to schedule or location, and lack access outside specific days or
            hours.
          </p>
          <p className="mt-2 text-brand/90">
            <strong className="text-brand">Homestead owners</strong> face a separate but related
            challenge: a lack of reliable, knowledgeable help for animal care and property
            responsibilities.
          </p>
          <p className="mt-4 text-brand/90">
            Together, these issues limit income for producers, reduce access for consumers, and
            contribute to burnout within homesteading communities.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-brand">How we solve it</h2>
          <p className="mt-2 text-brand/90">
            The Local Yield removes friction between local producers and local buyers by providing
            community-scale infrastructure that prioritizes:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-brand/90">
            <li>Always-available access to local products</li>
            <li>Direct-to-producer sales with minimal platform intervention</li>
            <li>Inclusion regardless of producer size, output, or staffing capacity</li>
            <li>Direct interaction between producers and customers</li>
            <li>Money staying within the local economy</li>
          </ul>
          <p className="mt-4 text-brand/90">
            The platform complements existing farmers markets by extending access beyond physical and
            logistical constraints, rather than replacing them.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-brand">Local-only, no shipping</h2>
          <p className="mt-2 text-brand/90">
            The Local Yield is intentionally designed as a local, community-based platform. Products
            are not shipped. Participation is limited to a defined regional area. All transactions
            occur within a distance reasonable to drive.
          </p>
          <p className="mt-4 text-brand/90">Fulfillment options are producer-controlled and may include:</p>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-brand/90">
            <li>Direct pickup</li>
            <li>Producer-arranged local delivery</li>
            <li>Community-based coordination</li>
          </ul>
          <p className="mt-4 text-brand/90">
            By eliminating long-distance shipping, the platform reduces packaging and shipping
            waste, lowers transportation-related environmental impact, and encourages direct,
            relationship-based exchange.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-brand">Fees, taxes & responsibility</h2>
          <p className="mt-2 text-brand/90">
            Producers are responsible for their own taxes and regulatory compliance. The platform
            does not provide tax or legal services. The Local Yield is not the seller of record and
            does not act as a distributor.
          </p>
          <p className="mt-4 text-brand/90">
            The platform is designed with awareness of Cottage Food Operation laws and similar
            small-producer regulations, supporting low-barrier participation while leaving
            compliance responsibility with the producer.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-brand">For farmers market managers</h2>
          <p className="mt-2 text-brand/90">
            We&apos;re not your competition — we&apos;re infrastructure. We help vendors sell when they&apos;re not at the market,
            help smaller vendors grow into market-ready sellers, and give them simple tools without taking them away from you.
            Co-branded pages, vendor schedules, and waitlist referrals can turn markets into allies.
          </p>
        </section>

        <section className="mt-12 flex flex-wrap gap-4">
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
        </section>
      </main>
    </div>
  );
}
