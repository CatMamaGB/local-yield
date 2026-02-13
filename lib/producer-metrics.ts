/**
 * Producer metrics — single source of truth for Producer Dashboard 2.0
 * Used by: /dashboard, /dashboard/analytics, /dashboard/records
 *
 * Schema alignment:
 * - Order.totalCents (int cents) is authoritative for revenue; use only (totalCents / 100).
 * - Product.price is Float (dollars) and must NOT be used for revenue.
 * - Product belongs to producer via Product.userId.
 * - OrderItems exist for multi-item orders; topSellingProduct uses OrderItem aggregation.
 *
 * Metric definitions:
 * - ordersPending: count of PENDING + PAID (awaiting payment or fulfillment). UI: "Orders Pending" / "Awaiting action".
 * - repeatCustomers: customers with >=2 PAID/FULFILLED orders (excludes canceled/refunded).
 * - newCustomersThisMonth: first PAID/FULFILLED order within current month (date range).
 *
 * Revenue: ONLY order.totalCents/100, only for status in ["PAID", "FULFILLED"].
 * - thisWeekRevenue: Mon 00:00 through today (calendar week to date)
 * - revenue7d: rolling last 7 days
 * - revenue30d: rolling last 30 days
 * getRevenueForPeriod: createdAt is [startDate, endDate) (end exclusive).
 */

import type { OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";

const PAID_OR_FULFILLED: OrderStatus[] = ["PAID", "FULFILLED"];

export interface ProducerMetrics {
  // Snapshot metrics
  thisWeekRevenue: number;
  ordersPending: number;
  repeatCustomers: number; // customers with >=2 orders
  activeListings: number;

  // Growth signals
  revenue7d: number; // rolling 7 days
  revenue30d: number;
  topSellingProduct: { title: string; revenue: number } | null;
  newCustomersThisMonth: number; // first order in current month

  // Lifetime (all-time PAID/FULFILLED)
  lifetimeRevenue: number; // dollars
  lifetimeOrdersPaidOrFulfilled: number;
  avgOrderValue: number; // dollars
}

/** Monday 00:00:00 of the current week (ISO week) */
function startOfWeek(now: Date): Date {
  const d = new Date(now);
  d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get comprehensive dashboard metrics for a producer
 * Uses targeted Prisma queries (count, aggregate, groupBy) to avoid over-fetching.
 */
export async function getProducerMetrics(producerId: string): Promise<ProducerMetrics> {
  const now = new Date();
  const startOfWeekDate = startOfWeek(now);
  const startOf7d = new Date(now);
  startOf7d.setDate(now.getDate() - 7);
  startOf7d.setHours(0, 0, 0, 0);
  const startOf30d = new Date(now);
  startOf30d.setDate(now.getDate() - 30);
  startOf30d.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const baseWhere = { producerId };
  const paidOrFulfilled = { status: { in: PAID_OR_FULFILLED } };

  // 1) Count pending orders (PENDING + PAID — awaiting payment or fulfillment). UI: "Orders Pending" / "Awaiting action".
  const ordersPending = await prisma.order.count({
    where: {
      ...baseWhere,
      status: { in: ["PENDING", "PAID"] },
    },
  });

  // 2) Lifetime: revenue and count for PAID/FULFILLED (all time)
  const [lifetimeAgg, lifetimeCount] = await Promise.all([
    prisma.order.aggregate({
      where: { ...baseWhere, ...paidOrFulfilled },
      _sum: { totalCents: true },
    }),
    prisma.order.count({
      where: { ...baseWhere, ...paidOrFulfilled },
    }),
  ]);
  const lifetimeRevenue = (lifetimeAgg._sum?.totalCents ?? 0) / 100;
  const lifetimeOrdersPaidOrFulfilled = lifetimeCount;
  const avgOrderValue = lifetimeCount > 0 ? lifetimeRevenue / lifetimeCount : 0;

  // 3) Aggregate revenue: this week (Mon–today), 7d rolling, 30d rolling — only totalCents/100. End-exclusive: [start, now).
  const [thisWeekAgg, revenue7dAgg, revenue30dAgg] = await Promise.all([
    prisma.order.aggregate({
      where: {
        ...baseWhere,
        ...paidOrFulfilled,
        createdAt: { gte: startOfWeekDate, lt: now },
      },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: {
        ...baseWhere,
        ...paidOrFulfilled,
        createdAt: { gte: startOf7d, lt: now },
      },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: {
        ...baseWhere,
        ...paidOrFulfilled,
        createdAt: { gte: startOf30d, lt: now },
      },
      _sum: { totalCents: true },
    }),
  ]);

  const thisWeekRevenue = (thisWeekAgg._sum?.totalCents ?? 0) / 100;
  const revenue7d = (revenue7dAgg._sum?.totalCents ?? 0) / 100;
  const revenue30d = (revenue30dAgg._sum?.totalCents ?? 0) / 100;

  // 4) Repeat customers: groupBy buyerId, PAID/FULFILLED only; count buyers with >=2 (exclude canceled/refunded)
  const buyerOrderCounts = await prisma.order.groupBy({
    by: ["buyerId"],
    where: { ...baseWhere, ...paidOrFulfilled },
    _count: { id: true },
  });
  const repeatCustomers = buyerOrderCounts.filter((g) => g._count.id >= 2).length;

  // 5) New customers this month: first order in month, PAID/FULFILLED only (exclude canceled/refunded)
  const firstOrderByBuyer = await prisma.order.groupBy({
    by: ["buyerId"],
    where: { ...baseWhere, ...paidOrFulfilled },
    _min: { createdAt: true },
  });
  const newCustomersThisMonth = firstOrderByBuyer.filter(
    (g) => g._min.createdAt && g._min.createdAt >= startOfMonth
  ).length;

  // 6) Active listings
  const activeListings = await prisma.product.count({
    where: {
      userId: producerId,
      OR: [{ quantityAvailable: { gt: 0 } }, { quantityAvailable: null }],
    },
  });

  // 7) Top selling product: OrderItem aggregation, last 30d, PAID/FULFILLED only. End-exclusive [startOf30d, now). Do not include Order.product; only orderItems + product title.
  const orders30dForTop = await prisma.order.findMany({
    where: {
      ...baseWhere,
      ...paidOrFulfilled,
      createdAt: { gte: startOf30d, lt: now },
    },
    select: {
      orderItems: {
        select: {
          productId: true,
          quantity: true,
          unitPriceCents: true,
          product: { select: { title: true } },
        },
      },
    },
  });

  const productRevenue = new Map<string, { title: string; revenue: number }>();
  for (const o of orders30dForTop) {
    for (const item of o.orderItems) {
      const revenue = (item.quantity * item.unitPriceCents) / 100;
      const existing = productRevenue.get(item.productId);
      if (existing) {
        productRevenue.set(item.productId, {
          title: existing.title,
          revenue: existing.revenue + revenue,
        });
      } else {
        productRevenue.set(item.productId, {
          title: item.product.title,
          revenue,
        });
      }
    }
  }
  const topSellingProductEntries = Array.from(productRevenue.entries()).sort(
    (a, b) => b[1].revenue - a[1].revenue
  );
  const topSellingProduct =
    topSellingProductEntries.length > 0
      ? {
          title: topSellingProductEntries[0][1].title,
          revenue: topSellingProductEntries[0][1].revenue,
        }
      : null;

  return {
    thisWeekRevenue,
    ordersPending,
    repeatCustomers,
    activeListings,
    revenue7d,
    revenue30d,
    topSellingProduct,
    newCustomersThisMonth,
    lifetimeRevenue,
    lifetimeOrdersPaidOrFulfilled,
    avgOrderValue,
  };
}

/**
 * Get revenue for a specific date range.
 * Revenue = sum of (order.totalCents / 100) only for PAID/FULFILLED.
 * End exclusive: createdAt { gte: startDate, lt: endDate }.
 */
export async function getRevenueForPeriod(
  producerId: string,
  startDate: Date,
  endDate: Date
): Promise<{ revenue: number; orderCount: number }> {
  const [agg, count] = await Promise.all([
    prisma.order.aggregate({
      where: {
        producerId,
        status: { in: PAID_OR_FULFILLED },
        createdAt: { gte: startDate, lt: endDate },
      },
      _sum: { totalCents: true },
    }),
    prisma.order.count({
      where: {
        producerId,
        status: { in: PAID_OR_FULFILLED },
        createdAt: { gte: startDate, lt: endDate },
      },
    }),
  ]);

  const revenue = (agg._sum?.totalCents ?? 0) / 100;
  return { revenue, orderCount: count };
}
