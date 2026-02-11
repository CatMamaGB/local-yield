/**
 * Cart page: list cart items, link to checkout.
 */

import Link from "next/link";
import { CartPageClient } from "./CartPageClient";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Your cart</h1>
        <CartPageClient />
        <p className="mt-4">
          <Link href="/market/browse" className="text-sm text-brand-accent hover:underline">
            ← Continue browsing
          </Link>
        </p>
      </div>
    </div>
  );
}
