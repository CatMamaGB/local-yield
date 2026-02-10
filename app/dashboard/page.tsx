/**
 * Dashboard home — content depends on role (buyer vs producer vs admin).
 * All authenticated users can reach this page; producer-only sub-routes protect themselves.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DemandNearYou } from "@/components/DemandNearYou";

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

  // Producer or Admin: show producer dashboard (products, orders, subscriptions, events)
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-brand">
          {user.role === "ADMIN" ? "Admin / Producer dashboard" : "Producer dashboard"}
        </h1>
        <p className="mt-2 text-brand/80">
          Manage your shop, orders, and events.
          {user.role === "ADMIN" && " You have admin access."}
        </p>
        <nav className="mt-8 grid gap-4 sm:grid-cols-2">
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
        </nav>
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
