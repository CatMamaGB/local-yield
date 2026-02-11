/**
 * Sales summary for producers — Tier 1: zero-overwhelm default.
 * Total sales (daily/weekly/monthly), card vs cash, top sellers.
 * Plain language, no analytics jargon.
 */

import { prisma } from "./prisma";

export type Period = "today" | "week" | "month";

function periodBounds(period: Period): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

export interface SalesSummaryResult {
  totalSales: number;
  orderCount: number;
  cardTotal: number;
  cashTotal: number;
  cardCount: number;
  cashCount: number;
  topProducts: { productId: string; title: string; quantity: number; total: number }[];
}

/**
 * Get sales summary for a producer over a period.
 * Uses order + product price; card = paid, cash = viaCash.
 */
export async function getSalesSummary(
  producerId: string,
  period: Period
): Promise<SalesSummaryResult> {
  const { start, end } = periodBounds(period);
  const orders = await prisma.order.findMany({
    where: {
      producerId,
      createdAt: { gte: start, lte: end },
    },
    include: {
      product: { select: { id: true, title: true, price: true } },
      orderItems: { include: { product: { select: { id: true, title: true } } } },
    },
  });

  let totalSales = 0;
  let cardTotal = 0;
  let cashTotal = 0;
  let cardCount = 0;
  let cashCount = 0;
  const productTotals: Record<string, { title: string; quantity: number; total: number }> = {};

  for (const o of orders) {
    const amount = o.totalCents > 0 ? o.totalCents / 100 : (o.product ? o.product.price : 0);
    totalSales += amount;
    if (o.paid) {
      cardTotal += amount;
      cardCount += 1;
    }
    if (o.viaCash) {
      cashTotal += amount;
      cashCount += 1;
    }
    if (o.orderItems.length > 0) {
      for (const item of o.orderItems) {
        const key = item.productId;
        const itemTotal = (item.quantity * item.unitPriceCents) / 100;
        if (!productTotals[key]) {
          productTotals[key] = { title: item.product.title, quantity: 0, total: 0 };
        }
        productTotals[key].quantity += item.quantity;
        productTotals[key].total += itemTotal;
      }
    } else if (o.product) {
      const key = o.product.id;
      if (!productTotals[key]) {
        productTotals[key] = { title: o.product.title, quantity: 0, total: 0 };
      }
      productTotals[key].quantity += 1;
      productTotals[key].total += amount;
    }
  }

  const topProducts = Object.entries(productTotals)
    .map(([productId, { title, quantity, total }]) => ({ productId, title, quantity, total }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    totalSales,
    orderCount: orders.length,
    cardTotal,
    cashTotal,
    cardCount,
    cashCount,
    topProducts,
  };
}

export interface SalesRow {
  date: string;
  product: string;
  payment: "card" | "cash" | "other";
  amount: number;
}

/**
 * Get flat list of sales for CSV export.
 */
export async function getSalesRowsForExport(
  producerId: string,
  period: Period
): Promise<SalesRow[]> {
  const { start, end } = periodBounds(period);
  const orders = await prisma.order.findMany({
    where: {
      producerId,
      createdAt: { gte: start, lte: end },
    },
    include: {
      product: { select: { title: true, price: true } },
      orderItems: { include: { product: { select: { title: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows: SalesRow[] = [];
  for (const o of orders) {
    const date = new Date(o.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const amount = o.totalCents > 0 ? o.totalCents / 100 : (o.product ? o.product.price : 0);
    if (o.orderItems.length > 0) {
      for (const item of o.orderItems) {
        rows.push({
          date,
          product: `${item.product.title} (×${item.quantity})`,
          payment: o.paid ? "card" : o.viaCash ? "cash" : "other",
          amount: (item.quantity * item.unitPriceCents) / 100,
        });
      }
    } else {
      rows.push({
        date,
        product: o.product?.title ?? "Order",
        payment: o.paid ? "card" : o.viaCash ? "cash" : "other",
        amount,
      });
    }
  }
  return rows;
}

/** Build CSV string for sales rows. */
export function salesRowsToCsv(rows: SalesRow[], summary: SalesSummaryResult): string {
  const headers = "Date,Product,Payment,Amount";
  const body = rows.map((r) => `${r.date},${escapeCsv(r.product)},${r.payment},${r.amount.toFixed(2)}`).join("\n");
  const footer = [
    "",
    "Summary",
    `Total sales,${summary.totalSales.toFixed(2)}`,
    `Card,${summary.cardTotal.toFixed(2)}`,
    `Cash,${summary.cashTotal.toFixed(2)}`,
  ].join("\n");
  return [headers, body, footer].join("\n");
}

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
