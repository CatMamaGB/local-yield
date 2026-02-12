/**
 * Profile: dynamic sections by chosen roles (buyer, producer, caregiver, care seeker).
 * Same user, multi-role; each section links to the same account.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ProducerProfileForm } from "@/components/ProducerProfileForm";

export default async function DashboardProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const isProducer = user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;
  const isBuyer = user.isBuyer === true;
  const isCaregiver = user.isCaregiver === true;
  const isCareSeeker = user.isHomesteadOwner === true;

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Profile</h1>
        <p className="mt-2 text-brand/80">
          Manage your account by role. All sections use the same account.
        </p>

        <div className="mt-6 space-y-6">
          {isBuyer && (
            <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-brand">Buyer</h2>
              <p className="mt-1 text-sm text-brand/80">
                Your orders and preferences as a buyer.
              </p>
              <p className="mt-3">
                <Link
                  href="/dashboard/orders"
                  className="text-sm font-medium text-brand-accent hover:underline"
                >
                  View your orders →
                </Link>
              </p>
            </section>
          )}

          {isProducer && (
            <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-brand">Producer</h2>
              <p className="mt-1 text-sm text-brand/80">
                How you appear to buyers. Set pickup notes and delivery options.
              </p>
              <div className="mt-4">
                <ProducerProfileForm />
              </div>
              <p className="mt-4">
                <Link
                  href="/dashboard/products"
                  className="text-sm font-medium text-brand-accent hover:underline"
                >
                  Manage products →
                </Link>
              </p>
            </section>
          )}

          {isCaregiver && (
            <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-brand">Caregiver</h2>
              <p className="mt-1 text-sm text-brand/80">
                Offer animal care services to the community.
              </p>
              <p className="mt-3 text-sm text-brand/70">
                Care listings coming soon. You can offer services from this account.
              </p>
            </section>
          )}

          {isCareSeeker && (
            <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-brand">Care Seeker</h2>
              <p className="mt-1 text-sm text-brand/80">
                Find caregivers for your animals.
              </p>
              <p className="mt-3">
                <Link
                  href="/care"
                  className="text-sm font-medium text-brand-accent hover:underline"
                >
                  Browse care services →
                </Link>
              </p>
            </section>
          )}

          {!isBuyer && !isProducer && !isCaregiver && !isCareSeeker && (
            <p className="text-brand/70">
              You don&apos;t have any roles set yet. Update your profile or contact support.
            </p>
          )}
        </div>

        <p className="mt-6">
          <Link href="/dashboard" className="text-sm text-brand-accent hover:underline">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
