/**
 * Terms of Use — plain-English, concise.
 * Platform is a marketplace/connector; users responsible for compliance; dispute basics; acceptable use; reviews; limitation of liability.
 */

import Link from "next/link";

export const metadata = {
  title: "Terms of Use | The Local Yield",
  description: "Terms of use for The Local Yield marketplace and care platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand">
          Terms of Use
        </h1>
        <p className="mt-2 text-brand/80 text-sm">
          Last updated: February 2025. Please read these terms carefully.
        </p>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">What we are</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            The Local Yield is a platform that connects buyers with local producers (Market) and
            seekers with caregivers (Care). We are a marketplace and connector — we are not the
            seller of goods, we are not the caregiver, and we do not take possession of or deliver
            your goods or perform care services. Transactions and bookings are between you and the
            other party. We do not guarantee the quality, safety, or legality of any listing or
            service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Your responsibilities</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            You are responsible for complying with all applicable laws, including food safety,
            labeling, and local regulations. Sellers are responsible for the accuracy of listings
            and for following cottage food and other rules that apply to their products. Caregivers
            and seekers are responsible for their own conduct and any agreements they make. We
            provide guidance and resources; we do not provide legal advice. You use the platform at
            your own risk.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Disputes</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            If you have a dispute with another user (buyer, seller, caregiver, or seeker), we
            encourage you to resolve it directly with that person. We may help facilitate
            communication or provide tools (e.g., reviews, resolution windows), but we are not
            obligated to resolve disputes or to take sides. Our role is to connect you; the
            relationship and any remedies are between you and the other party.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Acceptable use</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            You agree to use the platform honestly and respectfully. You may not harass, scam, or
            mislead others; list illegal items or services; or use the platform for fraud or
            abuse. You may not violate our{" "}
            <Link href="/community-guidelines" className="text-brand-accent underline hover:no-underline">
              Community Guidelines
            </Link>
            . We may suspend or terminate accounts that violate these terms or our policies.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Reviews and moderation</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            Reviews help the community make informed decisions. You may leave honest reviews after
            a transaction or booking. We may remove reviews that are false, abusive, or otherwise
            violate our policies. We may moderate content to keep the platform safe and useful.
            Our review and moderation policies are part of these terms.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Limitation of liability</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            The Local Yield is provided “as is.” We do not guarantee uninterrupted or error-free
            service. To the fullest extent permitted by law, we are not liable for any indirect,
            incidental, or consequential damages arising from your use of the platform or from
            transactions or bookings between users. Our liability is limited to the amount you paid
            us (if any) in the twelve months before the claim. Some jurisdictions do not allow
            certain limitations; in those cases, our liability is limited to the maximum permitted.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Changes</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            We may update these terms from time to time. We will post the updated terms on this
            page and update the “Last updated” date. Continued use of the platform after changes
            means you accept the updated terms. If you do not agree, you may stop using the
            platform and close your account.
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
