/**
 * Community Guidelines — kindness, honesty, no harassment, no scams, respect property/animals, no illegal items/services.
 */

import Link from "next/link";

export const metadata = {
  title: "Community Guidelines | The Local Yield",
  description: "How we expect everyone to behave on The Local Yield.",
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand">
          Community Guidelines
        </h1>
        <p className="mt-2 text-brand/80 text-sm">
          We expect everyone on The Local Yield to treat each other with respect and honesty.
        </p>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Be kind and honest</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Communicate clearly and respectfully. Describe your goods and services accurately. Don’t
            mislead, pressure, or harass others. We’re a community of neighbors — treat people the
            way you’d want to be treated.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">No harassment or abuse</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Harassment, threats, hate speech, and abuse are not allowed. We will remove content and
            suspend accounts that violate this. If someone is bothering you, you can report it and
            we will look into it.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">No scams or fraud</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Don’t use the platform to scam, defraud, or steal. Listings and messages must be
            truthful. Don’t take payment and fail to deliver, or offer services you don’t intend to
            provide. We take fraud seriously and may report it to authorities.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Respect property and animals</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            When you’re on someone else’s property — for pickup, delivery, or care — respect their
            land, animals, and belongings. Follow instructions they give you. Caregivers must
            treat animals with care and follow the owner’s guidelines. Property owners should provide
            clear instructions and emergency contacts.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">No illegal items or services</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            You may not list or offer anything illegal under applicable law. Sellers must comply
            with food safety and local regulations. Care services must be legal and appropriate.
            We may remove listings and suspend accounts that violate the law or our policies.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Reviews</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Reviews should be honest and based on your experience. Don’t post false or abusive
            reviews. We may remove reviews that violate our policies. Our goal is to help the
            community make informed decisions.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Enforcement</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            We may warn, suspend, or terminate accounts that violate these guidelines. Serious
            violations may result in permanent removal. If you see something that doesn’t belong,
            report it. We’re here to keep the community safe and welcoming.
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
