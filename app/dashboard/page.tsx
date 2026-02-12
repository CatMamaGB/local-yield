/**
 * Dashboard home — content depends on role (buyer vs producer vs admin).
 * Producer: alerts, summary counts, quick actions, recent orders preview, upcoming events.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForProducer } from "@/lib/orders";
import { getProducerAlertCounts } from "@/lib/dashboard-alerts";
import { DemandNearYou } from "@/components/DemandNearYou";
import { ExampleOrderPreview } from "@/components/ExampleOrderPreview";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const isProducer = user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;

  // Buyer-only: show buyer-focused dashboard (orders, browse)
  if (!isProducer) {
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

  // Producer or Admin: alerts, summary, quick actions, recent orders, upcoming events
  const [producerOrders, alertCounts] = await Promise.all([
    getOrdersForProducer(user.id),
    getProducerAlertCounts(user.id),
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
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-brand">
          {user.role === "ADMIN" ? "Admin / Producer dashboard" : "Producer dashboard"}
        </h1>
        <p className="mt-2 text-brand/80">
          Welcome back{user.name ? `, ${user.name}` : ""}. Here&apos;s what needs your attention.
        </p>

        {/* Alerts row */}
        {hasAlerts ? (
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            {alertCounts.pendingOrdersCount > 0 && (
              <Link
                href="/dashboard/orders"
                className="rounded-xl border-2 border-brand-accent/50 bg-white p-4 hover:border-brand-accent hover:bg-brand-light/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand/80">Orders needing action</span>
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-accent px-2 text-sm font-semibold text-white">
                    {alertCounts.pendingOrdersCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand/60">Pending or awaiting fulfillment</p>
              </Link>
            )}
            {alertCounts.pendingReviewsCount > 0 && (
              <Link
                href="/dashboard/reviews"
                className="rounded-xl border-2 border-brand-accent/50 bg-white p-4 hover:border-brand-accent hover:bg-brand-light/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand/80">Reviews to approve</span>
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-accent px-2 text-sm font-semibold text-white">
                    {alertCounts.pendingReviewsCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand/60">Private reviews awaiting action</p>
              </Link>
            )}
            {alertCounts.unreadMessagesCount > 0 && (
              <Link
                href="/dashboard/messages"
                className="rounded-xl border-2 border-brand-accent/50 bg-white p-4 hover:border-brand-accent hover:bg-brand-light/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand/80">New messages</span>
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-accent px-2 text-sm font-semibold text-white">
                    {alertCounts.unreadMessagesCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand/60">Unread customer messages</p>
              </Link>
            )}
          </section>
        ) : (
          <section className="mt-6">
            <div className="rounded-xl border border-brand/20 bg-white p-4 text-center">
              <p className="text-sm font-medium text-brand/70">✓ All caught up</p>
              <p className="mt-1 text-xs text-brand/60">No pending orders, reviews, or messages right now.</p>
            </div>
          </section>
        )}

        {/* Summary stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-brand/20 bg-white p-4">
            <p className="text-sm font-medium text-brand/70">Total Orders</p>
            <p className="mt-1 font-display text-3xl font-semibold text-brand">{totalOrders}</p>
          </div>
          <div className="rounded-xl border border-brand/20 bg-white p-4">
            <p className="text-sm font-medium text-brand/70">Pending</p>
            <p className="mt-1 font-display text-3xl font-semibold text-brand">{alertCounts.pendingOrdersCount}</p>
          </div>
          <div className="rounded-xl border border-brand/20 bg-white p-4">
            <p className="text-sm font-medium text-brand/70">Reviews</p>
            <p className="mt-1 font-display text-3xl font-semibold text-brand">{alertCounts.pendingReviewsCount}</p>
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-brand/70 uppercase tracking-wide">Quick Actions</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/products?action=add"
              className="rounded-lg border border-brand/30 bg-white px-4 py-3 text-sm font-medium text-brand hover:border-brand hover:bg-brand-light/50 transition"
            >
              + Add Product
            </Link>
            <Link
              href="/dashboard/events?action=add"
              className="rounded-lg border border-brand/30 bg-white px-4 py-3 text-sm font-medium text-brand hover:border-brand hover:bg-brand-light/50 transition"
            >
              + Add Event
            </Link>
            <Link
              href="/dashboard/profile"
              className="rounded-lg border border-brand/30 bg-white px-4 py-3 text-sm font-medium text-brand hover:border-brand hover:bg-brand-light/50 transition"
            >
              Update Profile
            </Link>
            <Link
              href={`/market/shop/${user.id}`}
              className="rounded-lg border border-brand/30 bg-white px-4 py-3 text-sm font-medium text-brand hover:border-brand hover:bg-brand-light/50 transition"
            >
              View Storefront
            </Link>
          </div>
        </section>

        {/* Recent orders preview */}
        {hasOrders ? (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand/70 uppercase tracking-wide">Recent Orders</h2>
              <Link href="/dashboard/orders" className="text-sm font-medium text-brand-accent hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders`}
                  className="block rounded-lg border border-brand/20 bg-white p-4 hover:border-brand hover:bg-brand-light/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand">
                        Order from {order.buyer?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-brand/60">
                        {formatDate(new Date(order.createdAt))} • ${(order.totalCents / 100).toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        order.status === "FULFILLED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "PAID"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
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
          <section className="mt-8">
            <ExampleOrderPreview />
          </section>
        )}

        {/* Admin links */}
        {user.role === "ADMIN" && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-brand/70 uppercase tracking-wide">Admin</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Link
                href="/admin/users"
                className="rounded-lg border-2 border-brand-accent bg-white p-4 font-medium text-brand hover:bg-brand-light"
              >
                Users
              </Link>
              <Link
                href="/admin/listings"
                className="rounded-lg border-2 border-brand-accent bg-white p-4 font-medium text-brand hover:bg-brand-light"
              >
                Listings
              </Link>
              <Link
                href="/admin/reviews"
                className="rounded-lg border-2 border-brand-accent bg-white p-4 font-medium text-brand hover:bg-brand-light"
              >
                Reviews
              </Link>
            </div>
          </section>
        )}

        {/* Demand near you */}
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
