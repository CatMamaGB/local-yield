/**
 * Profile: account (shared) + Your modes + role sections.
 * "Your modes": Buyer ✅ (default), Seller / Helper / Hire — add modes without a new account.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/authz/client";
import { AccountForm } from "@/components/AccountForm";
import { ProducerProfileForm } from "@/components/ProducerProfileForm";
import { AddModeButtons } from "@/components/AddModeButtons";

export default async function DashboardProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const { canSell } = getUserCapabilities(user);
  const isProducer = user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;
  const isBuyer = user.isBuyer === true;
  const isCaregiver = user.isCaregiver === true;
  const isCareSeeker = user.isHomesteadOwner === true;

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Profile</h1>
        <p className="mt-2 text-brand/80">
          Manage your account and preferences. All roles use the same account.
        </p>

        <div className="mt-6 space-y-6">
          <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-brand">Your modes</h2>
            <p className="mt-1 text-sm text-brand/80">
              Buyer is always on. Add selling or help when you&apos;re ready — no new account.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-brand">
              <li>Buyer ✓ (default)</li>
              {isProducer && <li>Seller ✓</li>}
              {isCaregiver && <li>Helper ✓</li>}
              {isCareSeeker && <li>Hire help ✓</li>}
            </ul>
            <div className="mt-4">
              <AddModeButtons canSell={canSell} isCaregiver={isCaregiver} isHomesteadOwner={isCareSeeker} />
            </div>
          </section>

          <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-brand">Account</h2>
            <p className="mt-1 text-sm text-brand/80">
              Name, contact, and default delivery address. Used across the app.
            </p>
            <div className="mt-4">
              <AccountForm />
            </div>
          </section>

          {isBuyer && (
            <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-brand">Buyer</h2>
              <p className="mt-1 text-sm text-brand/80">
                Your orders and order history.
              </p>
              <p className="mt-3">
                <Link
                  href="/dashboard/orders"
                  className="text-sm font-medium text-brand-accent hover:underline"
                >
                  View order history →
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
              <h2 className="font-display text-lg font-semibold text-brand">Helper</h2>
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
                Find helpers for your animals.
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
