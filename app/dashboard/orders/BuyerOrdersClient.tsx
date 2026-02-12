"use client";

/**
 * Buyer orders: order cards + Leave review / Update review + post-submit message and post-resolution prompt.
 */

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELED" | "REFUNDED";

interface OrderWithReview {
  id: string;
  title: string;
  producerName: string | null;
  pickupDate: Date | string | null;
  status: OrderStatus;
  pickupCode: string | null;
  createdAt: string;
  review: {
    id: string;
    comment: string;
    rating: number | null;
    privateFlag: boolean;
    resolved: boolean;
    createdAt: string;
    adminGuidance: string | null;
  } | null;
}

const POST_SUBMIT_MESSAGE = (
  <div className="mt-4 rounded-lg border border-brand/20 bg-brand-light/50 p-4 text-sm text-brand/80">
    <p className="font-medium text-brand">Thank you for your feedback.</p>
    <p className="mt-2">
      Producers may resolve concerns with you before your review is published. We value constructive feedback and aim to be fair to both sides. If things remain unresolved, you can escalate directly to platform support. After resolution, you&apos;ll be prompted to update your review if you wish.
    </p>
  </div>
);

export function BuyerOrdersClient({
  ordersWithReviews,
}: {
  ordersWithReviews: OrderWithReview[];
}) {
  const [justSubmittedOrderId, setJustSubmittedOrderId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, OrderWithReview["review"]>>(() => {
    const m: Record<string, OrderWithReview["review"]> = {};
    ordersWithReviews.forEach((o) => {
      m[o.id] = o.review;
    });
    return m;
  });
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [showFormOrderId, setShowFormOrderId] = useState<string | null>(null);
  const [showUpdateFormReviewId, setShowUpdateFormReviewId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(3);
  const [updateComment, setUpdateComment] = useState("");
  const [updateRating, setUpdateRating] = useState(3);

  async function handleSubmitReview(orderId: string) {
    const c = comment.trim();
    if (!c) return;
    setLoadingOrderId(orderId);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, comment: c, rating, privateFlag: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setReviews((prev) => ({
        ...prev,
        [orderId]: {
          id: data.review.id,
          comment: c,
          rating,
          privateFlag: data.review.privateFlag ?? true,
          resolved: false,
          createdAt: new Date().toISOString(),
          adminGuidance: null,
        },
      }));
      setJustSubmittedOrderId(orderId);
      setShowFormOrderId(null);
      setComment("");
      setRating(3);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingOrderId(null);
    }
  }

  async function handleUpdateReview(reviewId: string, orderId: string) {
    const c = updateComment.trim();
    if (!c) return;
    setLoadingOrderId(orderId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: c, rating: updateRating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setReviews((prev) => ({
        ...prev,
        [orderId]: prev[orderId]
          ? { ...prev[orderId]!, comment: c, rating: updateRating }
          : null,
      }));
      setShowUpdateFormReviewId(null);
      setUpdateComment("");
      setUpdateRating(3);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingOrderId(null);
    }
  }

  return (
    <ul className="mt-6 space-y-4">
      {ordersWithReviews.map((o) => {
        const review = reviews[o.id];
        const showPostSubmit = justSubmittedOrderId === o.id;
        return (
          <li
            key={o.id}
            className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display font-semibold text-brand">{o.title}</p>
                <p className="text-sm text-brand/70">
                  {o.producerName ?? "Producer"} · {o.pickupDate ? `Pickup ${formatDate(o.pickupDate)}` : "Pickup TBD"}
                </p>
                <div className="mt-2">
                  <OrderStatusBadge status={o.status} />
                </div>
              </div>
              {o.pickupCode && (
                <div className="rounded-lg border-2 border-dashed border-brand/30 bg-brand-light/50 px-4 py-2 text-center">
                  <p className="text-xs font-medium text-brand/70 uppercase tracking-wider">Pickup code</p>
                  <p className="font-mono text-xl font-bold text-brand">{o.pickupCode}</p>
                  <p className="text-xs text-brand/60">Show at pickup</p>
                </div>
              )}
            </div>

            {/* Leave review */}
            {!review && (
              <div className="mt-4 border-t border-brand/10 pt-4">
                {!showFormOrderId ? (
                  <button
                    type="button"
                    onClick={() => setShowFormOrderId(o.id)}
                    className="rounded border border-brand/30 px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light"
                  >
                    Leave a review
                  </button>
                ) : showFormOrderId === o.id ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-brand">Your feedback</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full rounded border border-brand/30 px-3 py-2 text-brand"
                      placeholder="Constructive feedback helps everyone."
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSubmitReview(o.id)}
                        disabled={!comment.trim() || loadingOrderId === o.id}
                        className="rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90 disabled:opacity-50"
                      >
                        {loadingOrderId === o.id ? "Submitting…" : "Submit review"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowFormOrderId(null); setComment(""); setRating(3); }}
                        className="rounded border border-brand/30 px-4 py-2 text-sm text-brand hover:bg-brand-light"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Post-submit message (after submitting a new review) */}
            {showPostSubmit && (
              <div className="mt-4">
                {POST_SUBMIT_MESSAGE}
              </div>
            )}

            {/* Already left a review */}
            {review && (
              <div className="mt-4 border-t border-brand/10 pt-4">
                <p className="text-sm font-medium text-brand/80">
                  Your review{review.privateFlag ? " (not yet public)" : ""}
                  {review.rating != null && ` · ${review.rating}/5`}
                </p>
                <p className="mt-1 text-sm text-brand/70">{review.comment}</p>
                {review.adminGuidance && (
                  <p className="mt-2 text-sm text-amber-800 bg-amber-50 rounded p-2">
                    Platform note: {review.adminGuidance}
                  </p>
                )}

                {/* Post-resolution: prompt to update review */}
                {review.resolved && (
                  <div className="mt-3 rounded-lg border border-brand/20 bg-brand-light/30 p-3">
                    <p className="text-sm font-medium text-brand">Resolution complete</p>
                    <p className="mt-1 text-sm text-brand/70">
                      You can update your review below if you wish. Your feedback helps other buyers and producers.
                    </p>
                    {showUpdateFormReviewId !== review.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUpdateFormReviewId(review.id);
                          setUpdateComment(review.comment);
                          setUpdateRating(review.rating ?? 3);
                        }}
                        className="mt-2 rounded border border-brand/30 px-3 py-1.5 text-sm text-brand hover:bg-brand-light"
                      >
                        Update my review
                      </button>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={updateComment}
                          onChange={(e) => setUpdateComment(e.target.value)}
                          rows={2}
                          className="w-full rounded border border-brand/30 px-3 py-2 text-sm text-brand"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-brand">Rating:</label>
                          <select
                            value={updateRating}
                            onChange={(e) => setUpdateRating(Number(e.target.value))}
                            className="rounded border border-brand/30 px-2 py-1 text-sm text-brand"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateReview(review.id, o.id)}
                            disabled={!updateComment.trim() || loadingOrderId === o.id}
                            className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand/90 disabled:opacity-50"
                          >
                            Save update
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUpdateFormReviewId(null)}
                            className="rounded border border-brand/30 px-3 py-1.5 text-sm text-brand hover:bg-brand-light"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!review.resolved && (
                  <p className="mt-2 text-xs text-brand/60">
                    The producer may message you to resolve concerns. If unresolved, you can escalate to platform support.
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
