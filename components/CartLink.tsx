"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export function CartLink() {
  const { itemCount } = useCart();
  return (
    <Link href="/market/cart" className="text-brand/80 hover:text-brand-accent">
      Cart{itemCount > 0 ? ` (${itemCount})` : ""}
    </Link>
  );
}
