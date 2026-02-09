/**
 * Producer dashboard home.
 * TODO: Protect with requireProducerOrAdmin; show stats and quick links.
 */

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-brand">Producer dashboard</h1>
        <p className="mt-2 text-brand/80">Manage your shop, orders, and events.</p>
        <nav className="mt-8 grid gap-4 sm:grid-cols-2">
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
      </div>
    </div>
  );
}
