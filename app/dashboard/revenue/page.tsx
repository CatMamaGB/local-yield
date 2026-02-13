/**
 * Revenue Page — Overview tab with revenue chart, Orders tab, Customers tab
 * Part of Producer Dashboard 2.0
 */

import { redirect } from "next/navigation";
import { requireProducerOrAdmin } from "@/lib/auth";
import { getOrdersForProducer } from "@/lib/orders";
import { getCustomersForProducer } from "@/lib/customers";
import { getProducerMetrics } from "@/lib/producer-metrics";
import { RevenuePageClient } from "./RevenuePageClient";

export default async function RevenuePage() {
  let user;
  try {
    user = await requireProducerOrAdmin();
  } catch {
    redirect("/dashboard");
  }

  const [orders, customers, metrics] = await Promise.all([
    getOrdersForProducer(user.id),
    getCustomersForProducer(user.id),
    getProducerMetrics(user.id),
  ]);

  // Get revenue data for chart (last 30 days, daily breakdown)
  const now = new Date();
  const startOf30d = new Date(now);
  startOf30d.setDate(now.getDate() - 30);
  startOf30d.setHours(0, 0, 0, 0);

  const revenueData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayOrders = orders.filter(
      (o) =>
        new Date(o.createdAt) >= date &&
        new Date(o.createdAt) < nextDay &&
        (o.status === "PAID" || o.status === "FULFILLED")
    );

    const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalCents ?? 0) / 100, 0);

    revenueData.push({
      date: date.toISOString().split("T")[0],
      revenue: dayRevenue,
      orderCount: dayOrders.length,
    });
  }

  return (
    <RevenuePageClient
      initialOrders={orders}
      initialCustomers={customers}
      metrics={metrics}
      revenueData={revenueData}
    />
  );
}
