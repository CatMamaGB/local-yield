/**
 * Privacy Policy — what we collect, what we don’t sell, cookies/session, deletion.
 */

import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | The Local Yield",
  description: "How The Local Yield collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand">
          Privacy Policy
        </h1>
        <p className="mt-2 text-brand/80 text-sm">
          Last updated: February 2025. We care about your privacy.
        </p>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">What we collect</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            We collect information you give us when you sign up and use the platform: account
            information (name, email, and similar), location (e.g., zip code) so we can show you
            local listings and caregivers, messages you send through the platform, and order or
            booking details. We use this to run the platform, connect you with local producers and
            caregivers, process orders and bookings, and improve our service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">What we don’t do</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            We do not sell your personal information to third parties for advertising or marketing.
            We use your data to operate The Local Yield and to communicate with you about your
            account and the platform. We may share data with service providers who help us run the
            platform (e.g., hosting, payments), under agreements that protect your data.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Cookies and sessions</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            We use cookies and similar technologies to keep you signed in, remember your
            preferences, and understand how the platform is used. Session data is used to maintain
            your login and cart. You can control cookies through your browser settings; some
            features may not work if you disable cookies.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Data retention</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            We keep your data as long as your account is active and as needed to provide the
            service, resolve disputes, and comply with legal obligations. Order and booking
            history may be retained for records and support.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Request deletion</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            You can request deletion of your account and personal data by contacting us. We will
            process your request in line with our policies and applicable law. Some data may be
            retained where required by law or for legitimate business purposes (e.g., completed
            transaction records).
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-brand">Security</h2>
          <p className="mt-2 text-brand/90 leading-relaxed">
            We take reasonable steps to protect your data, including encryption and secure
            practices. No system is completely secure; you use the platform at your own risk.
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
