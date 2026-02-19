/**
 * Sales Analytics — producer: sales history, revenue, key metrics, date range.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProducerOrAdmin } from "@/lib/auth";
import { getPaidOrdersForProducer } from "@/lib/orders";
import { getProducerMetrics, getRevenueForPeriod, getRevenueByDayForPeriod } from "@/lib/producer-metrics";
import { formatDate, formatPrice } from "@/lib/utils";
import { AnalyticsDateLinks } from "./AnalyticsDateLinks";

function parseRange(from?: string | null, to?: string | null): { start: Date; end: Date; label: string } {
  const end = to ? new Date(to) : new Date();
  end.setHours(23, 59, 59, 999);
  const start = from ? new Date(from) : new Date(end);
  if (!from) start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const label = from && to ? `Custom (${days}d)` : days <= 7 ? "7 days" : days <= 30 ? "30 days" : "90 days";
  return { start, end, label };
}

export default async function DashboardAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  let user;
  try {
    user = await requireProducerOrAdmin();
  } catch {
    redirect("/dashboard");
  }

  const { from, to } = await searchParams;
  const { start, end } = parseRange(from, to);

  const [orders, metrics, periodMetrics, revenueByDay] = await Promise.all([
    getPaidOrdersForProducer(user.id),
    getProducerMetrics(user.id),
    getRevenueForPeriod(user.id, start, end),
    getRevenueByDayForPeriod(user.id, start, end),
  ]);

  const maxDayRevenue = revenueByDay.length ? Math.max(...revenueByDay.map((d) => d.revenue), 1) : 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand">Sales Analytics</h1>
      <p className="mt-2 text-brand/80">Revenue, order count, and recent sales. Use this for your own records.</p>

      <AnalyticsDateLinks from={from} to={to} />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="text-sm font-medium text-brand/70">Selected period revenue</p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand">
            {formatPrice(periodMetrics.revenue)}
          </p>
        </div>
        <div className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-brand/70">Selected period orders</p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand">{periodMetrics.orderCount}</p>
        </div>
      </section>

      {revenueByDay.length > 0 && (
        <section className="mt-8 rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand">Revenue by day</h2>
          <div className="mt-4 flex flex-wrap items-end gap-1">
            {revenueByDay.slice(-30).map((d) => (
              <div
                key={d.date}
                className="flex flex-col items-center gap-1"
                title={`${d.date}: ${formatPrice(d.revenue * 100)}`}
              >
                <div
                  className="w-3 min-h-[4px] rounded-t bg-brand/70 hover:bg-brand"
                  style={{ height: `${Math.max(4, (d.revenue / maxDayRevenue) * 80)}px` }}
                />
                <span className="text-[10px] text-brand/60">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

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
