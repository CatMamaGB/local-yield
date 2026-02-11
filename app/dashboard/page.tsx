/**
 * Dashboard home — content depends on role (buyer vs producer vs admin).
 * Producer: plain-language links (Your records, Your customers). First-10-min win: example order preview when no orders yet.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForProducer } from "@/lib/orders";
import { DemandNearYou } from "@/components/DemandNearYou";
import { ExampleOrderPreview } from "@/components/ExampleOrderPreview";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Buyer: show buyer-focused dashboard (orders, browse)
  if (user.role === "BUYER") {
    return (
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="font-display text-3xl font-semibold text-brand">Your dashboard</h1>
          <p className="mt-2 text-brand/80">
            Hi{user.name ? ` ${user.name}` : ""}. View your orders and find local goods.
          </p>
          <nav className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/orders"
              className="rounded-xl border border-brand/20 bg-white p-6 font-medium text-brand hover:border-brand-accent hover:bg-brand-light"
            >
              Your orders
            </Link>
            <Link
              href="/market/browse"
              className="rounded-xl border border-brand/20 bg-white p-6 font-medium text-brand hover:border-brand-accent hover:bg-brand-light"
            >
              Browse local goods
            </Link>
          </nav>
        </div>
      </div>
    );
  }

  // Producer or Admin: Your records first (Tier 1), then products/orders, optional Your customers (Tier 2)
  const producerOrders = await getOrdersForProducer(user.id);
  const hasOrders = producerOrders.length > 0;

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-brand">
          {user.role === "ADMIN" ? "Admin / Producer dashboard" : "Producer dashboard"}
        </h1>
        <p className="mt-2 text-brand/80">
          Your shop, your orders, your records. Nothing required except what you need to sell.
          {user.role === "ADMIN" && " You have admin access."}
        </p>

        {/* Tier 1: Your records — zero-overwhelm default, prominent */}
        <section className="mt-8">
          <h2 className="sr-only">Your records</h2>
          <Link
            href="/dashboard/records"
            className="block rounded-xl border-2 border-brand/20 bg-white p-6 font-medium text-brand hover:border-brand hover:bg-brand-light/50"
          >
            <span className="font-display text-lg font-semibold">Your records</span>
            <p className="mt-1 text-sm text-brand/80">
              Here&apos;s what you sold — total sales, card vs cash, top sellers. Download a simple report anytime.
            </p>
          </Link>
        </section>

        <nav className="mt-6 grid gap-4 sm:grid-cols-2">
          {user.role === "ADMIN" && (
            <Link
              href="/admin/users"
              className="rounded-xl border-2 border-brand-accent bg-white p-6 font-medium text-brand hover:bg-brand-light"
            >
              Admin: Users
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link
              href="/admin/listings"
              className="rounded-xl border-2 border-brand-accent bg-white p-6 font-medium text-brand hover:bg-brand-light"
            >
              Admin: Listings
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link
              href="/admin/reviews"
              className="rounded-xl border-2 border-brand-accent bg-white p-6 font-medium text-brand hover:bg-brand-light"
            >
              Admin: Reviews
            </Link>
          )}
          <Link
            href="/dashboard/profile"
            className="rounded-xl border border-brand/20 bg-white p-6 font-medium text-brand hover:border-brand-accent hover:bg-brand-light"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/products"
            className="rounded-xl border border-brand/20 bg-white p-6 font-medium text-brand hover:border-brand-accent hover:bg-brand-light"
          >
            Products
          </Link>
          <Link
            href="/dashboard/orders"
            className="rounded-xl border border-brand/20 bg-white p-6 font-medium text-brand hover:border-brand-accent hover:bg-brand-light"
          >
            Orders
          </Link>
          <Link
            href="/dashboard/subscriptions"
            className="rounded-xl border border-brand/20 bg-white p-6 font-medium text-brand hover:border-brand-accent hover:bg-brand-light"
          >
            Subscriptions
          </Link>
          <Link
            href="/dashboard/events"
            className="rounded-xl border border-brand/20 bg-white p-6 font-medium text-brand hover:border-brand-accent hover:bg-brand-light"
          >
            Events
          </Link>
          <Link
            href="/dashboard/customers"
            className="rounded-xl border border-brand/20 bg-white p-6 font-medium text-brand/70 hover:border-brand/30 hover:bg-brand-light/50"
          >
            Your customers
            <span className="mt-1 block text-sm font-normal text-brand/60">
              Optional. Your list, your notes — export anytime.
            </span>
          </Link>
        </nav>

        {/* First 10 min win: see how a sale would look when no orders yet */}
        {!hasOrders && (
          <section className="mt-8">
            <ExampleOrderPreview />
          </section>
        )}

        <section className="mt-8 rounded-xl border border-brand/20 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-brand">Demand near you</h2>
          <p className="mt-1 text-sm text-brand/80">
            Open item requests from buyers within 25 mi of your ZIP. See what people are looking for.
          </p>
          <div className="mt-4">
            <DemandNearYou producerZip={user.zipCode} radiusMiles={25} />
          </div>
        </section>
      </div>
    </div>
  );
}
