"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { CartItemRow } from "@/components/market/CartItemRow";
import { formatPrice } from "@/lib/utils";

export function CartPageClient() {
  const { items, itemCount, singleProducerId, clearCart } = useCart();

  if (itemCount === 0) {
    return (
      <p className="mt-6 rounded-xl border border-brand/20 bg-white p-8 text-center text-brand/70">
        Your cart is empty. <Link href="/market/browse" className="text-brand-accent hover:underline">Browse</Link> to add items.
      </p>
    );
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  return (
    <div className="mt-6 space-y-4">
      <ul className="space-y-3">
        {items.map((item) => (
          <CartItemRow key={item.productId} item={item} />
        ))}
      </ul>
      <div className="rounded-xl border border-brand/20 bg-white p-4">
        <p className="flex justify-between text-brand">
          <span>Subtotal</span>
          <span>{formatPrice(subtotalCents / 100)}</span>
        </p>
        <p className="mt-1 text-sm text-brand/70">
          Delivery fee (if you choose delivery) is calculated at checkout.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/market/checkout"
          className="rounded bg-brand px-4 py-2 font-medium text-white hover:bg-brand/90"
        >
          Proceed to checkout
        </Link>
        <button
          type="button"
          onClick={() => clearCart()}
          className="rounded border border-brand/30 px-4 py-2 text-sm text-brand hover:bg-brand-light"
        >
          Clear cart
        </button>
      </div>
    </div>
  );
}
