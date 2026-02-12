"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { FulfillmentSelector } from "@/components/FulfillmentSelector";
import { formatPrice } from "@/lib/utils";

type FulfillmentType = "PICKUP" | "DELIVERY";

export function CheckoutClient() {
  const router = useRouter();
  const { items, itemCount, singleProducerId, clearCart } = useCart();
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("PICKUP");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryFeeCents, setDeliveryFeeCents] = useState(0);
  const [offersDelivery, setOffersDelivery] = useState(false);
  const [deliveryFeeError, setDeliveryFeeError] = useState<string | null>(null);

  useEffect(() => {
    if (!singleProducerId || items.length === 0) return;
    
    async function fetchDeliveryInfo() {
      try {
        const res = await fetch(`/api/shop/${singleProducerId}/delivery`);
        if (!res.ok) {
          throw new Error("Failed to fetch delivery information");
        }
        const data = await res.json();
        setOffersDelivery(data.offersDelivery ?? false);
        setDeliveryFeeCents(data.deliveryFeeCents ?? 0);
        setDeliveryFeeError(null);
      } catch (err) {
        console.error("Delivery fee fetch error:", err);
        setDeliveryFeeError("Unable to load delivery options");
        // Default to pickup if delivery fetch fails
        setOffersDelivery(false);
        setDeliveryFeeCents(0);
      }
    }

    fetchDeliveryInfo();
  }, [singleProducerId, items.length]);

  if (itemCount === 0) {
    return (
      <p className="mt-6 text-brand/70">
        Your cart is empty. <Link href="/market/cart" className="text-brand-accent hover:underline">View cart</Link>.
      </p>
    );
  }

  if (!singleProducerId) {
    return (
      <p className="mt-6 text-brand/70">
        Cart has items from different producers. Please order from one producer at a time.
        <Link href="/market/cart" className="ml-1 text-brand-accent hover:underline">Edit cart</Link>.
      </p>
    );
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  const deliveryFee = fulfillmentType === "DELIVERY" ? deliveryFeeCents : 0;
  const totalCents = subtotalCents + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producerId: singleProducerId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
          })),
          fulfillmentType,
          notes: notes.trim() || undefined,
        }),
      });
      
      const data = await res.json();
      
      // Check for success response format: { ok: true, data: { orderId, pickupCode } }
      if (!res.ok || !data.ok) {
        const errorMessage = data.error || data.message || "Checkout failed";
        throw new Error(errorMessage);
      }

      // Only clear cart after successful order creation
      if (data.ok && data.data?.orderId) {
        clearCart();
        router.push(`/market/order-confirmation/${data.data.orderId}`);
        router.refresh();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <FulfillmentSelector
        value={fulfillmentType}
        onChange={setFulfillmentType}
        offersDelivery={offersDelivery}
        deliveryFeeCents={deliveryFeeCents}
      />
      <div>
        <label className="block text-sm font-medium text-brand">Order notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
          placeholder="Pickup time preference, allergies, etc."
        />
      </div>
      <div className="rounded-xl border border-brand/20 bg-white p-4">
        <p className="flex justify-between text-brand">
          <span>Subtotal</span>
          <span>{formatPrice(subtotalCents / 100)}</span>
        </p>
        {fulfillmentType === "DELIVERY" && deliveryFeeCents > 0 && (
          <p className="mt-1 flex justify-between text-brand">
            <span>Delivery fee</span>
            <span>{formatPrice(deliveryFeeCents / 100)}</span>
          </p>
        )}
        <p className="mt-2 flex justify-between font-display font-semibold text-brand">
          <span>Total</span>
          <span>{formatPrice(totalCents / 100)}</span>
        </p>
      </div>
      {deliveryFeeError && fulfillmentType === "DELIVERY" && (
        <p className="text-sm text-yellow-600" role="alert">
          {deliveryFeeError}. Please contact the producer for delivery details.
        </p>
      )}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <p className="text-sm text-brand/70">
        You’ll pay the producer at pickup or delivery (cash or as arranged).
      </p>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-brand py-3 font-medium text-white hover:bg-brand/90 disabled:opacity-50"
      >
        {submitting ? "Placing order…" : "Place order"}
      </button>
      <p>
        <Link href="/market/cart" className="text-sm text-brand-accent hover:underline">
          ← Back to cart
        </Link>
      </p>
    </form>
  );
}
