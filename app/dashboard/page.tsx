/**
 * Dashboard home — content depends on role (buyer vs producer vs admin).
 * Producer: alerts, summary counts, quick actions, recent orders preview, upcoming events.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForProducer } from "@/lib/orders";
import { getProducerAlertCounts } from "@/lib/dashboard-alerts";
import { getProducerMetrics } from "@/lib/producer-metrics";
import { DemandNearYou } from "@/components/DemandNearYou";
import { ExampleOrderPreview } from "@/components/ExampleOrderPreview";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { GrowthSignalCard } from "@/components/dashboard/GrowthSignalCard";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const isProducer = user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;

  if (!isProducer) {
    return (
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h1 className="font-display text-3xl font-semibold text-brand leading-tight">Your dashboard</h1>
          <p className="mt-2 text-brand/80 leading-relaxed">
            Hi{user.name ? ` ${user.name}` : ""}. Manage your profile, view order history, and find local goods.
          </p>
          <nav className="mt-8 grid gap-5 sm:grid-cols-3">
            <Link
              href="/dashboard/profile"
              className="rounded-xl border border-brand/10 bg-white p-6 font-medium text-brand shadow-farmhouse transition hover:border-brand-accent/30 hover:shadow-farmhouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Profile & account
            </Link>
            <Link
              href="/dashboard/orders"
              className="rounded-xl border border-brand/10 bg-white p-6 font-medium text-brand shadow-farmhouse transition hover:border-brand-accent/30 hover:shadow-farmhouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Order history
            </Link>
            <Link
              href="/market/browse"
              className="rounded-xl border border-brand/10 bg-white p-6 font-medium text-brand shadow-farmhouse transition hover:border-brand-accent/30 hover:shadow-farmhouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Browse local goods
            </Link>
          </nav>
        </div>
      </div>
    );
  }

  // Producer or Admin: alerts, summary, quick actions, recent orders, upcoming events
  const [producerOrders, alertCounts, metrics] = await Promise.all([
    getOrdersForProducer(user.id),
    getProducerAlertCounts(user.id),
    getProducerMetrics(user.id),
  ]);
  
  const hasOrders = producerOrders.length > 0;
  const recentOrders = producerOrders.slice(0, 5);
  const totalOrders = producerOrders.length;

  const hasAlerts =
    alertCounts.pendingOrdersCount > 0 ||
    alertCounts.pendingReviewsCount > 0 ||
    alertCounts.unreadMessagesCount > 0;

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-brand leading-tight">
          {user.role === "ADMIN" ? "Admin / Producer dashboard" : "Producer dashboard"}
        </h1>
        <p className="mt-2 text-brand/80 leading-relaxed">
          Welcome back{user.name ? `, ${user.name}` : ""}. Here&apos;s what needs your attention.
        </p>

        {hasAlerts ? (
          <section className="mt-8 grid gap-5 sm:grid-cols-3">
            {alertCounts.pendingOrdersCount > 0 && (
              <Link
                href="/dashboard/orders"
                className="rounded-xl border border-brand-accent/40 bg-white p-5 shadow-farmhouse transition hover:border-brand-accent hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand/80">Orders needing action</span>
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-accent px-2 text-sm font-semibold text-white">
                    {alertCounts.pendingOrdersCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand/70 leading-relaxed">Pending or awaiting fulfillment</p>
              </Link>
            )}
            {alertCounts.pendingReviewsCount > 0 && (
              <Link
                href="/dashboard/reviews"
                className="rounded-xl border border-brand-accent/40 bg-white p-5 shadow-farmhouse transition hover:border-brand-accent hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand/80">Reviews to approve</span>
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-accent px-2 text-sm font-semibold text-white">
                    {alertCounts.pendingReviewsCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand/70 leading-relaxed">Private reviews awaiting action</p>
              </Link>
            )}
            {alertCounts.unreadMessagesCount > 0 && (
              <Link
                href="/dashboard/messages"
                className="rounded-xl border border-brand-accent/40 bg-white p-5 shadow-farmhouse transition hover:border-brand-accent hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand/80">New messages</span>
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-accent px-2 text-sm font-semibold text-white">
                    {alertCounts.unreadMessagesCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand/70 leading-relaxed">Unread customer messages</p>
              </Link>
            )}
          </section>
        ) : (
          <section className="mt-8">
            <div className="rounded-xl border border-brand/10 bg-white p-5 text-center shadow-farmhouse">
              <p className="text-sm font-medium text-brand/80">✓ All caught up</p>
              <p className="mt-1 text-xs text-brand/70 leading-relaxed">No pending orders, reviews, or messages right now.</p>
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-brand mb-4 leading-tight">Snapshot Metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="This Week Revenue (Mon–today)"
              value={formatPrice(metrics.thisWeekRevenue)}
              href="/dashboard/revenue"
            />
            <MetricCard
              label="Orders Pending"
              value={metrics.ordersPending}
              subtitle="Awaiting action"
              href="/dashboard/orders"
            />
            <MetricCard
              label="Repeat Customers"
              value={metrics.repeatCustomers}
              subtitle="2+ orders"
              href="/dashboard/customers"
            />
            <MetricCard
              label="Active Listings"
              value={metrics.activeListings}
              href="/dashboard/products"
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-brand mb-4 leading-tight">Growth Signals</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GrowthSignalCard
              label="Revenue (rolling 7d)"
              value={formatPrice(metrics.revenue7d)}
              trend={metrics.revenue7d > 0 ? "up" : "neutral"}
            />
            <GrowthSignalCard
              label="Revenue (30d)"
              value={formatPrice(metrics.revenue30d)}
              trend={metrics.revenue30d > 0 ? "up" : "neutral"}
            />
            <GrowthSignalCard
              label="Top Selling Product"
              value={metrics.topSellingProduct?.title || "None"}
              subtitle={metrics.topSellingProduct ? formatPrice(metrics.topSellingProduct.revenue) : "No sales yet"}
            />
            <GrowthSignalCard
              label="New Customers"
              value={metrics.newCustomersThisMonth}
              subtitle="This month"
              trend={metrics.newCustomersThisMonth > 0 ? "up" : "neutral"}
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
            <h2 className="font-display text-xl font-semibold text-brand mb-2 leading-tight">Repeat Behavior</h2>
            <p className="text-sm text-brand/80 mb-4 leading-relaxed">
              Customers who have placed multiple orders with you.
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold text-brand">{metrics.repeatCustomers}</span>
              <span className="text-sm text-brand/70">repeat buyers</span>
            </div>
            <Link
              href="/dashboard/customers"
              className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline"
            >
              View all customers →
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-brand mb-4 leading-tight">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/products?action=add"
              className="rounded-lg border border-brand/10 bg-white px-4 py-3 text-sm font-medium text-brand shadow-farmhouse transition hover:border-brand-accent/30 hover:bg-brand-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              + Add Product
            </Link>
            <Link
              href="/dashboard/events?action=add"
              className="rounded-lg border border-brand/10 bg-white px-4 py-3 text-sm font-medium text-brand shadow-farmhouse transition hover:border-brand-accent/30 hover:bg-brand-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              + Add Event
            </Link>
            <Link
              href="/dashboard/profile"
              className="rounded-lg border border-brand/10 bg-white px-4 py-3 text-sm font-medium text-brand shadow-farmhouse transition hover:border-brand-accent/30 hover:bg-brand-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Update Profile
            </Link>
            <Link
              href={`/market/shop/${user.id}`}
              className="rounded-lg border border-brand/10 bg-white px-4 py-3 text-sm font-medium text-brand shadow-farmhouse transition hover:border-brand-accent/30 hover:bg-brand-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              View Storefront
            </Link>
          </div>
        </section>

        {hasOrders ? (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-brand leading-tight">Recent Orders</h2>
              <Link href="/dashboard/orders" className="text-sm font-medium text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders`}
                  className="block rounded-xl border border-brand/10 bg-white p-4 shadow-farmhouse transition hover:border-brand-accent/20 hover:bg-brand-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand">
                        Order from {order.buyer?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-brand/70 leading-relaxed">
                        {formatDate(new Date(order.createdAt))} • ${(order.totalCents / 100).toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        order.status === "FULFILLED"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "PAID"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-10">
            <ExampleOrderPreview />
          </section>
        )}

        {user.role === "ADMIN" && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-brand mb-4 leading-tight">Admin</h2>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Link
                href="/admin/users"
                className="rounded-lg border border-brand-accent/40 bg-white p-4 font-medium text-brand shadow-farmhouse transition hover:border-brand-accent hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                Users
              </Link>
              <Link
                href="/admin/listings"
                className="rounded-lg border border-brand-accent/40 bg-white p-4 font-medium text-brand shadow-farmhouse transition hover:border-brand-accent hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                Listings
              </Link>
              <Link
                href="/admin/reviews"
                className="rounded-lg border border-brand-accent/40 bg-white p-4 font-medium text-brand shadow-farmhouse transition hover:border-brand-accent hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                Reviews
              </Link>
              <Link
                href="/admin/flagged-reviews"
                className="rounded-lg border border-brand-accent/40 bg-white p-4 font-medium text-brand shadow-farmhouse transition hover:border-brand-accent hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                Flagged reviews
              </Link>
              <Link
                href="/admin/custom-categories"
                className="rounded-lg border border-brand-accent/40 bg-white p-4 font-medium text-brand shadow-farmhouse transition hover:border-brand-accent hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                Custom categories
              </Link>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
            <h2 className="font-display text-xl font-semibold text-brand mb-2 leading-tight">Demand Near You</h2>
            <p className="text-sm text-brand/80 mb-4 leading-relaxed">
              Open item requests from buyers within 25 mi of your ZIP. See what people are looking for.
            </p>
            <div className="mt-4">
              <DemandNearYou producerZip={user.zipCode} radiusMiles={25} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
