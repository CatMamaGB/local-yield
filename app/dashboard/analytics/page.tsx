/**
 * Sales Analytics — producer: sales history, revenue, key metrics.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProducerOrAdmin } from "@/lib/auth";
import { getPaidOrdersForProducer } from "@/lib/orders";
import { getProducerMetrics } from "@/lib/producer-metrics";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function DashboardAnalyticsPage() {
  let user;
  try {
    user = await requireProducerOrAdmin();
  } catch {
    redirect("/dashboard");
  }

  const [orders, metrics] = await Promise.all([
    getPaidOrdersForProducer(user.id),
    getProducerMetrics(user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand">Sales Analytics</h1>
      <p className="mt-2 text-brand/80">Revenue, order count, and recent sales. Use this for your own records.</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-brand/70">Total revenue</p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand">
            {formatPrice(metrics.lifetimeRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-brand/70">Orders (paid/fulfilled)</p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand">{metrics.lifetimeOrdersPaidOrFulfilled}</p>
        </div>
        <div className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-brand/70">Average order</p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand">
            {formatPrice(metrics.avgOrderValue)}
          </p>
        </div>
        <div className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-brand/70">Revenue (30d)</p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand">
            {formatPrice(metrics.revenue30d)}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand">Sales history</h2>
        <p className="mt-1 text-sm text-brand/70">Recent paid or fulfilled orders.</p>
        {orders.length === 0 ? (
          <p className="mt-6 text-brand/60">No sales yet. Orders will appear here once paid or fulfilled.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {orders.slice(0, 20).map((o) => {
              const title =
                o.orderItems.length > 0
                  ? o.orderItems.length === 1
                    ? o.orderItems[0].product.title
                    : `${o.orderItems.length} items`
                  : o.product?.title ?? "Order";
              return (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-brand/10 pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium text-brand">{title}</p>
                    <p className="text-sm text-brand/70">
                      {o.buyer.name ?? "Buyer"} · {formatDate(o.createdAt)} · {o.status}
                    </p>
                  </div>
                  <p className="font-semibold text-brand">${((o.totalCents ?? 0) / 100).toFixed(2)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-6">
        <Link href="/dashboard/orders" className="text-sm text-brand-accent hover:underline">
          View all orders →
        </Link>
      </p>
    </div>
  );
}
