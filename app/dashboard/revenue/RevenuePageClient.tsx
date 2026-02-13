"use client";

/**
 * Revenue Page Client Component
 * Tabs: Overview (with chart), Orders, Customers
 */

import { useState } from "react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import type { ProducerCustomer } from "@/lib/customers";
import type { ProducerMetrics } from "@/lib/producer-metrics";

type OrderWithRelations = Awaited<ReturnType<typeof import("@/lib/orders").getOrdersForProducer>>[0];

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

interface RevenuePageClientProps {
  initialOrders: OrderWithRelations[];
  initialCustomers: ProducerCustomer[];
  metrics: ProducerMetrics;
  revenueData: RevenueDataPoint[];
}

export function RevenuePageClient({
  initialOrders,
  initialCustomers,
  metrics,
  revenueData,
}: RevenuePageClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "customers">("overview");

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-semibold text-brand">Revenue</h1>
      <p className="mt-2 text-brand/80">Track your sales performance and customer insights.</p>

      {/* Tabs */}
      <div className="mt-6 border-b border-brand/20">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === "overview"
                ? "border-brand-accent text-brand-accent"
                : "border-transparent text-brand/70 hover:text-brand"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === "orders"
                ? "border-brand-accent text-brand-accent"
                : "border-transparent text-brand/70 hover:text-brand"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === "customers"
                ? "border-brand-accent text-brand-accent"
                : "border-transparent text-brand/70 hover:text-brand"
            }`}
          >
            Customers
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-brand/20 bg-white p-4">
                <p className="text-sm font-medium text-brand/70">Revenue (rolling 7d)</p>
                <p className="mt-1 font-display text-2xl font-semibold text-brand">
                  {formatPrice(metrics.revenue7d)}
                </p>
              </div>
              <div className="rounded-xl border border-brand/20 bg-white p-4">
                <p className="text-sm font-medium text-brand/70">Revenue (rolling 30d)</p>
                <p className="mt-1 font-display text-2xl font-semibold text-brand">
                  {formatPrice(metrics.revenue30d)}
                </p>
              </div>
              <div className="rounded-xl border border-brand/20 bg-white p-4">
                <p className="text-sm font-medium text-brand/70">Total Orders</p>
                <p className="mt-1 font-display text-2xl font-semibold text-brand">
                  {initialOrders.length}
                </p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="rounded-xl border border-brand/20 bg-white p-6">
              <h2 className="font-display text-lg font-semibold text-brand mb-4">
                Revenue Last 30 Days
              </h2>
              <div className="flex items-end justify-between gap-1 h-64 border-b border-brand/20 pb-2">
                {revenueData.map((point, idx) => {
                  const height = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative h-full"
                      title={`${formatDate(point.date)}: ${formatPrice(point.revenue)} (${point.orderCount} orders)`}
                    >
                      <div
                        className="w-full bg-brand-accent rounded-t transition-all hover:bg-brand-accent/80 cursor-pointer min-h-[2px]"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      {idx % 7 === 0 && (
                        <span className="text-xs text-brand/60 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap absolute -bottom-6 left-0">
                          {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex items-center justify-between text-sm text-brand/70">
                <span>{formatDate(revenueData[0]?.date || "")}</span>
                <span className="text-brand/50">Total: {formatPrice(revenueData.reduce((sum, d) => sum + d.revenue, 0))}</span>
                <span>{formatDate(revenueData[revenueData.length - 1]?.date || "")}</span>
              </div>
            </div>

            {/* Top Products */}
            {metrics.topSellingProduct && (
              <div className="rounded-xl border border-brand/20 bg-white p-6">
                <h2 className="font-display text-lg font-semibold text-brand mb-4">
                  Top Selling Product
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-brand">{metrics.topSellingProduct.title}</p>
                    <p className="text-sm text-brand/70">
                      Revenue: {formatPrice(metrics.topSellingProduct.revenue)}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/products"
                    className="text-sm font-medium text-brand-accent hover:underline"
                  >
                    View Products →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-brand">All Orders</h2>
              <Link
                href="/dashboard/orders"
                className="text-sm font-medium text-brand-accent hover:underline"
              >
                Manage Orders →
              </Link>
            </div>
            {initialOrders.length === 0 ? (
              <div className="rounded-xl border border-brand/20 bg-white p-8 text-center">
                <p className="text-brand/70">No orders yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {initialOrders.map((order) => {
                  const amount = order.totalCents > 0 ? order.totalCents / 100 : 0;
                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border border-brand/20 bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-brand">
                            Order from {order.buyer?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-brand/60">
                            {formatDate(new Date(order.createdAt))} • {formatPrice(amount)}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-brand">All Customers</h2>
              <Link
                href="/dashboard/customers"
                className="text-sm font-medium text-brand-accent hover:underline"
              >
                Manage Customers →
              </Link>
            </div>
            {initialCustomers.length === 0 ? (
              <div className="rounded-xl border border-brand/20 bg-white p-8 text-center">
                <p className="text-brand/70">No customers yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {initialCustomers.map((customer) => (
                  <div
                    key={customer.buyerId}
                    className="rounded-lg border border-brand/20 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-brand">
                          {customer.name || customer.email}
                        </p>
                        <p className="text-xs text-brand/60">
                          {customer.orderCount} {customer.orderCount === 1 ? "order" : "orders"}
                          {customer.lastOrderAt &&
                            ` • Last order: ${formatDate(customer.lastOrderAt)}`}
                        </p>
                      </div>
                      {customer.orderCount > 1 && (
                        <span className="rounded-full bg-brand-accent/20 px-2.5 py-1 text-xs font-medium text-brand-accent">
                          Repeat
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
