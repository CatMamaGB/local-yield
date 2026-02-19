"use client";

/**
 * Producer can review the buyer after order is fulfilled (one per order).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";

interface ReviewBuyerBlockProps {
  orderId: string;
  buyerId: string;
  buyerName: string;
}

export function ReviewBuyerBlock({ orderId, buyerId, buyerName }: ReviewBuyerBlockProps) {
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = comment.trim();
    if (!c) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost("/api/reviews", {
        orderId,
        revieweeId: buyerId,
        comment: c,
        rating,
        privateFlag: false,
      });
      setDone(true);
      setShowForm(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed"));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <p className="text-sm text-brand/70">You left a review for {buyerName}.</p>;
  }

  if (!showForm) {
    return (
      <div>
        <p className="text-sm text-brand/80">You can leave a review for {buyerName}.</p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-2 rounded border border-brand/30 px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light"
        >
          Review buyer
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-brand">Review {buyerName}</p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="w-full rounded border border-brand/30 px-3 py-2 text-brand"
        placeholder="Optional feedback about this buyer."
        required
      />
      <div className="flex items-center gap-2">
        <label className="text-sm text-brand">Rating (1–5):</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded border border-brand/30 px-2 py-1 text-brand"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !comment.trim()}
          className="rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit review"}
        </button>
        <button
          type="button"
          onClick={() => { setShowForm(false); setError(null); }}
          className="rounded border border-brand/30 px-4 py-2 text-sm text-brand hover:bg-brand-light"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
