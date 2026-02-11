"use client";

import { useState, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { OrderStatusFilter, type OrderFilterStatus } from "@/components/OrderStatusFilter";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { MarkFulfilledButton } from "@/components/MarkFulfilledButton";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELED" | "REFUNDED";

interface OrderItem {
  id: string;
  status: OrderStatus;
  pickupCode: string | null;
  pickupDate: Date | string | null;
  createdAt: string;
  buyer: { name: string | null };
  orderItems: Array<{ product: { title: string } }>;
  product: { title: string } | null;
}

interface ProducerOrdersClientProps {
  initialOrders: OrderItem[];
}

export function ProducerOrdersClient({ initialOrders }: ProducerOrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<OrderFilterStatus>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return orders;
    if (filter === "PENDING") return orders.filter((o) => o.status === "PENDING" || o.status === "PAID");
    return orders.filter((o) => o.status === "FULFILLED");
  }, [orders, filter]);

  const counts = useMemo(() => ({
    pending: orders.filter((o) => o.status === "PENDING" || o.status === "PAID").length,
    fulfilled: orders.filter((o) => o.status === "FULFILLED").length,
  }), [orders]);

  function handleFulfilled(orderId: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "FULFILLED" as const } : o
      )
    );
  }

  if (orders.length === 0) {
    return <p className="mt-6 text-brand/70">No orders yet.</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      <OrderStatusFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
      />
      <ul className="space-y-4">
        {filtered.map((o) => {
          const title =
            o.orderItems.length > 0
              ? o.orderItems.length === 1
                ? o.orderItems[0].product.title
                : `${o.orderItems.length} items`
              : o.product?.title ?? "Order";
          const isPending = o.status === "PENDING" || o.status === "PAID";
          return (
            <li
              key={o.id}
              className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold text-brand">{title}</p>
                  <p className="text-sm text-brand/70">
                    {o.buyer.name ?? "Buyer"} · {o.pickupDate ? `Pickup ${formatDate(o.pickupDate)}` : "Pickup TBD"}
                  </p>
                  <div className="mt-2">
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {o.pickupCode && (
                    <div className="rounded-lg border-2 border-dashed border-brand/30 bg-brand-light/50 px-4 py-2 text-center">
                      <p className="text-xs font-medium text-brand/70 uppercase tracking-wider">Their code</p>
                      <p className="font-mono text-xl font-bold text-brand">{o.pickupCode}</p>
                    </div>
                  )}
                  {isPending && (
                    <MarkFulfilledButton orderId={o.id} onFulfilled={() => handleFulfilled(o.id)} />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
