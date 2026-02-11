/**
 * Dashboard orders: buyer sees their orders (with pickup code); producer sees orders to fulfill with status + actions.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForBuyer, getOrdersForProducer } from "@/lib/orders";
import { formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { ProducerOrdersClient } from "./ProducerOrdersClient";

export default async function DashboardOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const isProducer = user.role === "PRODUCER" || user.role === "ADMIN";
  const buyerOrders = await getOrdersForBuyer(user.id);
  const producerOrders = await getOrdersForProducer(user.id);

  if (!isProducer) {
    return (
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="font-display text-2xl font-semibold text-brand">Your orders</h1>
          <p className="mt-2 text-brand/80">Orders you’ve placed. Show your pickup code at pickup.</p>
          {buyerOrders.length === 0 ? (
            <p className="mt-6 text-brand/70">No orders yet. <Link href="/market/browse" className="text-brand-accent hover:underline">Browse</Link> to order.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {buyerOrders.map((o) => {
                const title = o.orderItems.length > 0
                  ? o.orderItems.length === 1
                    ? o.orderItems[0].product.title
                    : `${o.orderItems.length} items`
                  : o.product?.title ?? "Order";
                return (
                <li
                  key={o.id}
                  className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-semibold text-brand">{title}</p>
                      <p className="text-sm text-brand/70">
                        {o.producer.name ?? "Producer"} · {o.pickupDate ? `Pickup ${formatDate(o.pickupDate)}` : "Pickup TBD"}
                      </p>
                      <div className="mt-2">
                        <OrderStatusBadge status={o.status} />
                      </div>
                    </div>
                    {o.pickupCode && (
                      <div className="rounded-lg border-2 border-dashed border-brand/30 bg-brand-light/50 px-4 py-2 text-center">
                        <p className="text-xs font-medium text-brand/70 uppercase tracking-wider">Pickup code</p>
                        <p className="font-mono text-xl font-bold text-brand">{o.pickupCode}</p>
                        <p className="text-xs text-brand/60">Show at pickup</p>
                      </div>
                    )}
                  </div>
                </li>
              ); })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const initialOrders = producerOrders.map((o) => ({
    id: o.id,
    status: o.status,
    pickupCode: o.pickupCode,
    pickupDate: o.pickupDate,
    createdAt: o.createdAt.toISOString(),
    buyer: o.buyer,
    orderItems: o.orderItems,
    product: o.product,
  }));

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Orders</h1>
        <p className="mt-2 text-brand/80">Orders to fulfill. Buyers will show their pickup code at pickup.</p>
        <ProducerOrdersClient initialOrders={initialOrders} />
      </div>
    </div>
  );
}
