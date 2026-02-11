"use client";

import { useState } from "react";

export interface MarkFulfilledButtonProps {
  orderId: string;
  onFulfilled?: () => void;
  className?: string;
}

export function MarkFulfilledButton({
  orderId,
  onFulfilled,
  className = "",
}: MarkFulfilledButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FULFILLED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed");
      }
      onFulfilled?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to mark fulfilled");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded border border-green-600 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 disabled:opacity-50 ${className}`}
    >
      {loading ? "Updating…" : "Mark fulfilled"}
    </button>
  );
}
