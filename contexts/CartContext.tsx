"use client";

/**
 * Cart context: items by producer (MVP: one producer per cart when adding).
 * Persists to localStorage key "localyield_cart".
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  productId: string;
  quantity: number;
  producerId: string;
  title: string;
  price: number;
  unitPriceCents: number;
  imageUrl: string | null;
}

const CART_STORAGE_KEY = "localyield_cart";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  /** Single producer id if all items are from one producer; else null */
  singleProducerId: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadFromStorage();
    queueMicrotask(() => {
      setItems(loaded);
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (mounted) saveToStorage(items);
  }, [mounted, items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const quantity = item.quantity ?? 1;
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        const producerIds = new Set(prev.map((i) => i.producerId));
        if (producerIds.size > 0 && !producerIds.has(item.producerId)) {
          return [{ ...item, quantity } as CartItem];
        }
        return [...prev, { ...item, quantity } as CartItem];
      });
    },
    []
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const singleProducerId = useMemo(() => {
    const ids = new Set(items.map((i) => i.producerId));
    return ids.size === 1 ? [...ids][0]! : null;
  }, [items]);

  const value: CartContextValue = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      itemCount,
      singleProducerId,
    }),
    [items, addItem, updateQuantity, removeItem, clearCart, itemCount, singleProducerId]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
