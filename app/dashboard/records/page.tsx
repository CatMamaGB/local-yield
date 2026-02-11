/**
 * Your records — Tier 1: zero-overwhelm default for every producer.
 * Total sales (daily/weekly/monthly), card vs cash, top sellers.
 * Plain language: "Here's what you sold." No dashboards full of charts.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProducerOrAdmin } from "@/lib/auth";
import {
  getSalesSummary,
  getSalesRowsForExport,
  salesRowsToCsv,
  type Period,
} from "@/lib/sales-summary";
import { formatPrice } from "@/lib/utils";
import { RecordsClient } from "./RecordsClient";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
];

export default async function DashboardRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  let user;
  try {
    user = await requireProducerOrAdmin();
  } catch {
    redirect("/dashboard");
  }
  const producerId = user.id;

  const params = await searchParams;
  const period = (params.period === "today" || params.period === "week" || params.period === "month"
    ? params.period
    : "week") as Period;

  const summary = await getSalesSummary(producerId, period);
  const rows = await getSalesRowsForExport(producerId, period);
  const csvContent = salesRowsToCsv(rows, summary);

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? "Last 7 days";

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-brand">Your records</h1>
            <p className="mt-1 text-brand/80">
              Here&apos;s what you sold. No setup — this is automatic.
            </p>
          </div>
          <RecordsClient
            period={period}
            periodLabel={periodLabel}
            periods={PERIODS}
            csvContent={csvContent}
            periodLabelForFile={periodLabel.replace(/\s+/g, "-").toLowerCase()}
          />
        </div>

        {/* Period tabs + Download CSV are in RecordsClient */}

        <section className="mt-8 rounded-xl border border-brand/20 bg-white p-6">
          <h2 className="sr-only">Sales summary</h2>
          {summary.orderCount === 0 ? (
            <p className="text-brand/70">
              No sales in this period yet. When you get orders, they&apos;ll show here — and you can
              download a simple report anytime.
            </p>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-brand/70">Total sales</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-brand">
                    {formatPrice(summary.totalSales)}
                  </p>
                  <p className="text-xs text-brand/60">{summary.orderCount} orders</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-brand/70">Card</p>
                  <p className="mt-1 font-display text-xl font-semibold text-brand">
                    {formatPrice(summary.cardTotal)}
                  </p>
                  <p className="text-xs text-brand/60">{summary.cardCount} orders</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-brand/70">Cash</p>
                  <p className="mt-1 font-display text-xl font-semibold text-brand">
                    {formatPrice(summary.cashTotal)}
                  </p>
                  <p className="text-xs text-brand/60">{summary.cashCount} orders</p>
                </div>
              </div>

              {summary.topProducts.length > 0 && (
                <div className="mt-8 border-t border-brand/15 pt-6">
                  <h3 className="font-display text-lg font-semibold text-brand">Top sellers</h3>
                  <p className="mt-1 text-sm text-brand/70">Your best-performing products in this period.</p>
                  <ul className="mt-4 space-y-2">
                    {summary.topProducts.map((p) => (
                      <li
                        key={p.productId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand/10 bg-brand-light/30 px-4 py-3"
                      >
                        <span className="font-medium text-brand">{p.title}</span>
                        <span className="text-sm text-brand/70">
                          {p.quantity} sold · {formatPrice(p.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>

        <p className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-brand-accent hover:underline">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
