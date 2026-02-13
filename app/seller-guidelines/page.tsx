/**
 * Seller Guidelines — follow local laws + food safety; examples (cottage food, labeling, temperature, truthful listings); we don’t give legal advice.
 */

import Link from "next/link";

export const metadata = {
  title: "Seller Guidelines | The Local Yield",
  description: "What sellers need to know about local laws and food safety on The Local Yield.",
};

export default function SellerGuidelinesPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand">
          Seller Guidelines
        </h1>
        <p className="mt-2 text-brand/80 text-sm">
          You must follow your local laws and food safety rules. We provide guidance, not legal advice.
        </p>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Your responsibility</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            As a seller on The Local Yield Market, you are responsible for complying with all
            applicable laws — including food safety, labeling, and local regulations. The Local
            Yield is a platform that connects you with buyers; we are not the seller of record and
            we do not enforce the law. You must know and follow the rules that apply to your
            products and your location.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Cottage food and local rules</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Cottage food laws vary by state and locality. Some states allow certain home-made foods
            to be sold without a commercial kitchen; others require permits, inspections, or
            labeling. You are responsible for knowing what applies to you. We provide general
            guidance and links to resources; we do not provide legal advice. When in doubt, check
            with your local health department or a qualified advisor.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Labeling and disclosure</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Listings must be truthful. Describe your products accurately — ingredients, allergens,
            and any required disclosures under your local law. Buyers deserve to know what they’re
            getting. Misleading or false listings violate our{" "}
            <Link href="/community-guidelines" className="text-brand-accent underline hover:no-underline">
              Community Guidelines
            </Link>{" "}
            and may be removed.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Temperature-controlled and perishable items</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            If you sell items that need refrigeration or special handling, you are responsible for
            storing, transporting, and delivering them safely. Follow food safety guidelines for
            temperature control and handling. Buyers should receive products in safe condition.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Pickup and delivery</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            You set how buyers get their orders — pickup at a location you choose, or delivery
            within your area. Be clear about times, locations, and any fees. No shipping — The
            Local Yield is local only. Coordinate with buyers through the platform so everyone
            knows what to expect.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">We are not your lawyer</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            The Local Yield does not provide legal, tax, or regulatory advice. We offer guidance and
            resources to help you understand common requirements; we cannot tell you what applies
            to your specific situation. For legal or compliance questions, consult a qualified
            professional or your local authorities.
          </p>
        </section>

        <section className="mt-10">
          <Link href="/" className="text-brand-accent font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded">
            Back to home
          </Link>
        </section>
      </main>
    </div>
  );
}
