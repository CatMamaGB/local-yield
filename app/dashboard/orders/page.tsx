/**
 * Dashboard orders: buyer sees their orders (with pickup code); producer sees orders to fulfill with status + actions.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForBuyer, getOrdersForProducer } from "@/lib/orders";
import { getReviewByOrderForBuyer } from "@/lib/reviews";
import { ProducerOrdersClient } from "./ProducerOrdersClient";
import { BuyerOrdersClient } from "./BuyerOrdersClient";

export default async function DashboardOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const isProducer = user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;
  const buyerOrders = await getOrdersForBuyer(user.id);
  const producerOrders = await getOrdersForProducer(user.id);

  if (!isProducer) {
    const ordersWithReviews = await Promise.all(
      buyerOrders.map(async (o) => {
        const title =
          o.orderItems.length > 0
            ? o.orderItems.length === 1
              ? o.orderItems[0].product.title
              : `${o.orderItems.length} items`
            : o.product?.title ?? "Order";
        const review = await getReviewByOrderForBuyer(user.id, o.id);
        return {
          id: o.id,
          title,
          producerName: o.producer.name ?? null,
          pickupDate: o.pickupDate,
          status: o.status,
          pickupCode: o.pickupCode,
          createdAt: o.createdAt.toISOString(),
          review: review
            ? {
                id: review.id,
                comment: review.comment,
                rating: review.rating,
                privateFlag: review.privateFlag,
                resolved: review.resolved,
                createdAt: review.createdAt.toISOString(),
                adminGuidance: review.adminGuidance,
              }
            : null,
        };
      })
    );
    return (
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="font-display text-2xl font-semibold text-brand">Your orders</h1>
          <p className="mt-2 text-brand/80">Orders you’ve placed. Show your pickup code at pickup. Leave or update reviews below.</p>
          {buyerOrders.length === 0 ? (
            <p className="mt-6 text-brand/70">No orders yet. <Link href="/market/browse" className="text-brand-accent hover:underline">Browse</Link> to order.</p>
          ) : (
            <BuyerOrdersClient ordersWithReviews={ordersWithReviews} />
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
