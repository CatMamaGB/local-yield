/**
 * Checkout: fulfillment, notes, place order (cash). Requires auth and cart from one producer.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutClient } from "./CheckoutClient";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Checkout</h1>
        <CheckoutClient />
      </div>
    </div>
  );
}
