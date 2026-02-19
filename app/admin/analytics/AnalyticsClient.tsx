"use client";

/**
 * Fetches GET /api/admin/analytics and displays platform metrics.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/client/api-client";

type Analytics = {
  totalUsers: number;
  totalOrders: number;
  gmvCents: number;
  totalBookings: number;
  reportsPending: number;
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function AnalyticsClient() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<Analytics>("/api/admin/analytics")
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load analytics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-brand/80">Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const cards = [
    { label: "Total users", value: data.totalUsers.toLocaleString(), href: "/admin/users" },
    { label: "Total orders", value: data.totalOrders.toLocaleString(), href: null },
    { label: "GMV", value: formatCurrency(data.gmvCents), href: null },
    { label: "Care bookings", value: data.totalBookings.toLocaleString(), href: "/admin/bookings" },
    { label: "Reports pending", value: data.reportsPending.toLocaleString(), href: "/admin/reports" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ label, value, href }) => (
        <div
          key={label}
          className="rounded-lg border border-brand/10 bg-white p-5 shadow-farmhouse"
        >
          <p className="text-sm font-medium text-brand/70">{label}</p>
          {href ? (
            <Link href={href} className="mt-1 block text-xl font-semibold text-brand hover:underline">
              {value}
            </Link>
          ) : (
            <p className="mt-1 text-xl font-semibold text-brand">{value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
