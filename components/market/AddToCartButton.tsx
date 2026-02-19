"use client";

/**
 * AddToCartButton — adds product to cart. Shows "In cart" or quantity when already in cart.
 */

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";

export interface AddToCartButtonProps {
  productId: string;
  producerId: string;
  title: string;
  price: number;
  imageUrl: string | null;
  /** If cart has items from another producer, adding will replace cart (user is warned in cart page). */
  className?: string;
}

export function AddToCartButton({
  productId,
  producerId,
  title,
  price,
  imageUrl,
  className = "",
}: AddToCartButtonProps) {
  const { items, addItem, updateQuantity, singleProducerId } = useCart();
  const [adding, setAdding] = useState(false);
  const existing = items.find((i) => i.productId === productId);
  const unitPriceCents = Math.round(price * 100);

  function handleAdd() {
    setAdding(true);
    // addItem already handles producer switching internally (replaces cart if different producer)
    addItem({
      productId,
      producerId,
      title,
      price,
      unitPriceCents,
      imageUrl,
      quantity: 1,
    });
    setAdding(false);
  }

  if (existing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => updateQuantity(productId, Math.max(0, existing.quantity - 1))}
          className="rounded border border-brand/30 px-2 py-1 text-sm text-brand hover:bg-brand-light"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="min-w-[1.5rem] text-center text-sm font-medium text-brand">
          {existing.quantity}
        </span>
        <button
          type="button"
          onClick={() => updateQuantity(productId, existing.quantity + 1)}
          className="rounded border border-brand/30 px-2 py-1 text-sm text-brand hover:bg-brand-light"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={adding}
      className={`rounded bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50 ${className}`}
    >
      {adding ? "Adding…" : "Add to cart"}
    </button>
  );
}
