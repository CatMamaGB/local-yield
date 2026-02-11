/**
 * Order confirmation: show order summary and pickup code after checkout.
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const { orderId } = await params;
  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    include: {
      orderItems: { include: { product: { select: { title: true, price: true } } } },
      product: { select: { title: true, price: true } },
      producer: { select: { name: true } },
    },
  });

  if (!order) notFound();

  const title =
    order.orderItems.length > 0
      ? order.orderItems.length === 1
        ? order.orderItems[0].product.title
        : `${order.orderItems.length} items`
      : order.product?.title ?? "Order";

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Order confirmed</h1>
        <p className="mt-2 text-brand/80">
          Your order with {order.producer.name ?? "the producer"} has been placed.
        </p>
        <div className="mt-6 rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
          <p className="font-display font-semibold text-brand">{title}</p>
          <p className="text-sm text-brand/70">
            Order #{order.id.slice(-8).toUpperCase()} · {formatDate(order.createdAt)}
          </p>
          {order.pickupCode && (
            <div className="mt-4 rounded-lg border-2 border-dashed border-brand/30 bg-brand-light/50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-brand/70">
                Your pickup code
              </p>
              <p className="font-mono text-2xl font-bold text-brand">{order.pickupCode}</p>
              <p className="text-xs text-brand/60">Show this at pickup</p>
            </div>
          )}
          <p className="mt-4 flex justify-between text-brand">
            <span>Total</span>
            <span>{formatPrice(order.totalCents / 100)}</span>
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/orders"
            className="rounded bg-brand px-4 py-2 font-medium text-white hover:bg-brand/90"
          >
            View my orders
          </Link>
          <Link href="/market/browse" className="rounded border border-brand/30 px-4 py-2 text-brand hover:bg-brand-light">
            Continue browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
