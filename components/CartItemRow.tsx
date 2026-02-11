"use client";

import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/contexts/CartContext";

export interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <li className="flex items-center gap-4 rounded-xl border border-brand/20 bg-white p-4">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-brand-light">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-brand/50">No image</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold text-brand">{item.title}</p>
        <p className="text-sm text-brand/70">
          {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
          className="rounded border border-brand/30 px-2 py-1 text-sm text-brand hover:bg-brand-light"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="min-w-[1.5rem] text-center text-sm font-medium">{item.quantity}</span>
        <button
          type="button"
          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
          className="rounded border border-brand/30 px-2 py-1 text-sm text-brand hover:bg-brand-light"
          aria-label="Increase quantity"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => removeItem(item.productId)}
          className="ml-2 text-sm text-red-600 hover:underline"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
