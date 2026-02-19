/**
 * Order detail / tracking page. Buyer or producer view with status, items, and actions.
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrderByIdForUser } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { OrderDetailClient } from "./OrderDetailClient";
import { ReviewBuyerBlock } from "./ReviewBuyerBlock";

export default async function DashboardOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const { id } = await params;
  const order = await getOrderByIdForUser(id, user.id, user.role === "ADMIN");
  if (!order) notFound();

  const isProducer = order.producerId === user.id;
  const hasProducerReview = isProducer
    ? (await prisma.review.count({ where: { orderId: order.id, reviewerId: user.id, revieweeId: order.buyerId } })) > 0
    : false;

  const title =
    order.orderItems.length > 0
      ? order.orderItems.length === 1
        ? order.orderItems[0].product.title
        : `${order.orderItems.length} items`
      : order.product?.title ?? "Order";

  const isBuyer = order.buyerId === user.id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard/orders" className="text-brand-accent hover:underline text-sm">
        ← Back to orders
      </Link>
      <div className="mt-4 rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
        <h1 className="font-display text-xl font-semibold text-brand">Order: {title}</h1>
        <p className="mt-1 text-sm text-brand/70">
          {isBuyer ? `From ${order.producer.name ?? "Producer"}` : `To ${order.buyer.name ?? "Buyer"}`}
        </p>
        <div className="mt-4">
          <OrderStatusBadge status={order.status} />
        </div>

        <OrderTimeline
          status={order.status}
          createdAt={order.createdAt}
          paidAt={order.paidAt}
          fulfilledAt={order.fulfilledAt}
        />

        <div className="mt-6 space-y-2 border-t border-brand/10 pt-4">
          <p className="text-sm text-brand/80">
            <span className="font-medium">Placed:</span> {formatDate(order.createdAt)}
          </p>
          {order.fulfillmentType && (
            <p className="text-sm text-brand/80">
              <span className="font-medium">Fulfillment:</span> {order.fulfillmentType}
            </p>
          )}
          {order.pickupDate && (
            <p className="text-sm text-brand/80">
              <span className="font-medium">Pickup date:</span> {formatDate(order.pickupDate)}
            </p>
          )}
          {(order as { requestedDeliveryDate?: Date | null }).requestedDeliveryDate && (
            <p className="text-sm text-brand/80">
              <span className="font-medium">Requested delivery:</span>{" "}
              {formatDate((order as { requestedDeliveryDate: Date }).requestedDeliveryDate)}
            </p>
          )}
          {order.fulfillmentType === "DELIVERY" && (
            <p className="text-sm text-brand/70 mt-2 rounded-lg bg-brand-light/50 p-2">
              For delivery orders, contact the producer to arrange the delivery time.
            </p>
          )}
          {order.fulfilledAt && (
            <p className="text-sm text-brand/80">
              <span className="font-medium">Fulfilled:</span> {formatDate(order.fulfilledAt)}
            </p>
          )}
        </div>

        {order.pickupCode && (
          <div className="mt-4 rounded-lg border-2 border-dashed border-brand/30 bg-brand-light/50 px-4 py-3 text-center">
            <p className="text-xs font-medium text-brand/70 uppercase tracking-wider">Pickup code</p>
            <p className="font-mono text-2xl font-bold text-brand">{order.pickupCode}</p>
            <p className="text-xs text-brand/60">Show at pickup</p>
          </div>
        )}

        <ul className="mt-6 space-y-2 border-t border-brand/10 pt-4">
          {order.orderItems.length > 0
            ? order.orderItems.map((oi) => (
                <li key={oi.id} className="flex justify-between text-sm">
                  <span className="text-brand">{oi.product.title} × {oi.quantity}</span>
                  <span className="text-brand">{formatPrice(oi.quantity * oi.unitPriceCents)}</span>
                </li>
              ))
            : order.product && (
                <li className="flex justify-between text-sm">
                  <span className="text-brand">{order.product.title}</span>
                  <span className="text-brand">{formatPrice(order.product.price * 100)}</span>
                </li>
              )}
        </ul>
        <div className="mt-2 flex justify-end gap-2 text-sm">
          {order.creditAppliedCents > 0 && (
            <span className="text-brand/70">
              Store credit: -{formatPrice(order.creditAppliedCents)}
            </span>
          )}
          {order.deliveryFeeCents > 0 && (
            <span className="text-brand/70">Delivery: {formatPrice(order.deliveryFeeCents)}</span>
          )}
          <span className="font-semibold text-brand">Total: {formatPrice(order.totalCents ?? 0)}</span>
        </div>

        {order.notes && (
          <p className="mt-4 text-sm text-brand/70 border-t border-brand/10 pt-4">
            <span className="font-medium">Notes:</span> {order.notes}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-brand/10 pt-4">
          <OrderDetailClient
            orderId={order.id}
            isBuyer={isBuyer}
            isProducer={isProducer}
            status={order.status}
          />
        </div>

        {isProducer && order.status === "FULFILLED" && !hasProducerReview && (
          <div className="mt-6 border-t border-brand/10 pt-4">
            <ReviewBuyerBlock orderId={order.id} buyerId={order.buyerId} buyerName={order.buyer.name ?? "Buyer"} />
          </div>
        )}
      </div>
    </div>
  );
}
