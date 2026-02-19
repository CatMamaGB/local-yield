"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { FulfillmentSelector } from "@/components/FulfillmentSelector";
import { formatPrice } from "@/lib/utils";
import { apiGet, apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";

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
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);
  const [applyCredit, setApplyCredit] = useState(true);

  useEffect(() => {
    if (!singleProducerId || items.length === 0) return;

    async function fetchDeliveryInfo() {
      try {
        const data = await apiGet<{ offersDelivery?: boolean; deliveryFeeCents?: number }>(
          `/api/shop/${singleProducerId}/delivery`
        );
        setOffersDelivery(data.offersDelivery ?? false);
        setDeliveryFeeCents(data.deliveryFeeCents ?? 0);
        setDeliveryFeeError(null);
      } catch {
        setDeliveryFeeError("Unable to load delivery options");
        setOffersDelivery(false);
        setDeliveryFeeCents(0);
      }
    }

    fetchDeliveryInfo();
  }, [singleProducerId, items.length]);

  useEffect(() => {
    if (!singleProducerId) return;
    apiGet<{ balanceCents: number }>(`/api/credits/balance?producerId=${singleProducerId}`)
      .then((res) => setCreditBalanceCents(res.balanceCents ?? 0))
      .catch(() => setCreditBalanceCents(0));
  }, [singleProducerId]);

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
  const appliedCreditCents =
    applyCredit && creditBalanceCents > 0 ? Math.min(creditBalanceCents, totalCents) : 0;
  const payWithCardCents = totalCents - appliedCreditCents;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const data = await apiPost<{ orderId: string; pickupCode?: string }>("/api/orders", {
        producerId: singleProducerId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        })),
        fulfillmentType,
        notes: notes.trim() || undefined,
        appliedCreditCents: appliedCreditCents > 0 ? appliedCreditCents : undefined,
        idempotencyKey,
      });

      if (data?.orderId) {
        clearCart();
        router.push(`/market/order-confirmation/${data.orderId}`);
        router.refresh();
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Checkout failed");
      setError(msg);
    } finally {
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
      {creditBalanceCents > 0 && (
        <label className="flex items-center gap-2 text-sm text-brand">
          <input
            type="checkbox"
            checked={applyCredit}
            onChange={(e) => setApplyCredit(e.target.checked)}
            className="rounded border-brand/30"
          />
          Apply ${(Math.min(creditBalanceCents, totalCents) / 100).toFixed(2)} store credit from this producer
        </label>
      )}
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
        {appliedCreditCents > 0 && (
          <p className="mt-1 flex justify-between text-brand/80">
            <span>Store credit applied</span>
            <span>-{formatPrice(appliedCreditCents / 100)}</span>
          </p>
        )}
        <p className="mt-2 flex justify-between font-display font-semibold text-brand">
          <span>{payWithCardCents === 0 ? "Total (credit)" : "Total"}</span>
          <span>{formatPrice(payWithCardCents / 100)}</span>
        </p>
      </div>
      {deliveryFeeError && fulfillmentType === "DELIVERY" && (
        <InlineAlert variant="warning" className="mt-2">
          {deliveryFeeError}. Please contact the producer for delivery details.
        </InlineAlert>
      )}
      {error && (
        <InlineAlert variant="error" className="mt-2">
          {error}
        </InlineAlert>
      )}
      <p className="text-sm text-brand/70">
        This places an order request with the producer. No payment is taken online. You'll pay the producer at pickup or delivery (cash or as arranged).
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
