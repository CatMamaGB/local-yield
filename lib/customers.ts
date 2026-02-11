/**
 * Your customers — Tier 2: optional growth tools.
 * Customer list (buyers who ordered from you), repeat count, notes, export.
 * Position as ownership: "Your customers belong to you."
 */

import { prisma } from "./prisma";

export interface ProducerCustomer {
  buyerId: string;
  name: string | null;
  email: string;
  orderCount: number;
  lastOrderAt: Date | null;
  note: string | null;
}

/**
 * Get list of buyers who have ordered from this producer, with order count and optional note.
 */
export async function getCustomersForProducer(producerId: string): Promise<ProducerCustomer[]> {
  const orders = await prisma.order.findMany({
    where: { producerId },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byBuyer = new Map<
    string,
    { name: string | null; email: string; orderCount: number; lastOrderAt: Date | null }
  >();
  for (const o of orders) {
    const b = o.buyer;
    const existing = byBuyer.get(b.id);
    if (existing) {
      existing.orderCount += 1;
      if (o.createdAt > (existing.lastOrderAt ?? new Date(0))) {
        existing.lastOrderAt = o.createdAt;
      }
    } else {
      byBuyer.set(b.id, {
        name: b.name,
        email: b.email,
        orderCount: 1,
        lastOrderAt: o.createdAt,
      });
    }
  }

  const noteRows = await prisma.producerCustomerNote.findMany({
    where: { producerId },
    select: { buyerId: true, note: true },
  });
  const notesByBuyer = new Map(noteRows.map((r) => [r.buyerId, r.note]));

  return Array.from(byBuyer.entries()).map(([buyerId, data]) => ({
    buyerId,
    name: data.name,
    email: data.email,
    orderCount: data.orderCount,
    lastOrderAt: data.lastOrderAt,
    note: notesByBuyer.get(buyerId) ?? null,
  }));
}

/**
 * Set or clear the optional note for a producer–buyer pair.
 */
export async function setProducerCustomerNote(
  producerId: string,
  buyerId: string,
  note: string | null
): Promise<void> {
  await prisma.producerCustomerNote.upsert({
    where: {
      producerId_buyerId: { producerId, buyerId },
    },
    create: { producerId, buyerId, note },
    update: { note },
  });
}

/** Build CSV for export: Name, Email, Orders, Last order, Note. */
export function customersToCsv(customers: ProducerCustomer[]): string {
  const header = "Name,Email,Orders,Last order,Note";
  const rows = customers.map((c) => {
    const name = (c.name ?? "").replace(/"/g, '""');
    const email = (c.email ?? "").replace(/"/g, '""');
    const note = (c.note ?? "").replace(/"/g, '""');
    const lastOrder = c.lastOrderAt
      ? new Date(c.lastOrderAt).toLocaleDateString("en-US", { dateStyle: "medium" })
      : "";
    return `"${name}","${email}",${c.orderCount},${lastOrder},"${note}"`;
  });
  return [header, ...rows].join("\n");
}
