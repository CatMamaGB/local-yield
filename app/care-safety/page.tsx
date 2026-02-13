/**
 * Care & Safety — expectations checklist (animal instructions, emergency vet, property access, biosecurity, communication); platform is not an insurer; encourage meeting first.
 */

import Link from "next/link";

export const metadata = {
  title: "Care & Safety | The Local Yield",
  description: "Expectations for caregivers and seekers on The Local Yield Care.",
};

export default function CareSafetyPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand">
          Care &amp; Safety
        </h1>
        <p className="mt-2 text-brand/80 text-sm">
          Clear expectations help everyone stay safe and build trust.
        </p>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Expectations checklist</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Before a booking, we encourage both parties to agree on the basics. Use this as a
            starting point — add what matters for your animals and property.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-brand/90 leading-relaxed">
            <li>
              <strong className="text-brand">Animal instructions:</strong> Feeding, watering,
              medications, handling preferences, and any special needs. Put it in writing (messages
              or notes) so nothing is missed.
            </li>
            <li>
              <strong className="text-brand">Emergency vet:</strong> Contact info for your vet and
              any after-hours or emergency clinic. Caregivers should know who to call if something
              goes wrong.
            </li>
            <li>
              <strong className="text-brand">Property access:</strong> How the caregiver gets in
              (keys, codes, gates), where to park, and any areas that are off-limits.
            </li>
            <li>
              <strong className="text-brand">Biosecurity basics:</strong> If you have livestock or
              biosecurity concerns (e.g., don’t visit other farms before coming), share that. Caregivers
              should follow your guidelines.
            </li>
            <li>
              <strong className="text-brand">Communication:</strong> How often to check in (e.g.,
              daily updates), and how to reach each other in an emergency.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Meeting first</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            When possible, we encourage seekers and caregivers to meet before the first booking.
            You can show the caregiver your property, introduce your animals, and go over
            instructions in person. It builds trust and reduces surprises. If meeting in person
            isn’t possible, a video call or detailed written instructions can help.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">The Local Yield is not an insurer</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            We connect seekers with caregivers. We do not employ caregivers, we do not guarantee
            their work, and we are not an insurer. Each party is responsible for their own
            conduct, compliance with laws, and any agreements they make. We encourage written
            expectations (in messages or notes) and clear communication. For more on liability,
            see our{" "}
            <Link href="/terms" className="text-brand-accent underline hover:no-underline">
              Terms of Use
            </Link>.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Respect and safety</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Caregivers should treat animals and property with care and follow the owner’s
            instructions. Seekers should provide clear, honest information and respect the
            caregiver’s time and boundaries. Everyone must follow our{" "}
            <Link href="/community-guidelines" className="text-brand-accent underline hover:no-underline">
              Community Guidelines
            </Link>.
            If something goes wrong, communicate directly first; you can also report issues through
            the platform.
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
