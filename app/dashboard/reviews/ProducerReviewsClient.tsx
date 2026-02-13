"use client";

/**
 * Pending reviews: Approve, Flag, Message with clear explanations.
 * Message opens private chat; after exchange, customer can optionally update review.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";

interface PendingReviewRow {
  id: string;
  comment: string;
  rating: number | null;
  producerResponse: string | null;
  resolved: boolean;
  createdAt: string;
  reviewer: { id: string; name: string | null; email: string };
  orderId: string | null;
}

export function ProducerReviewsClient({
  pendingReviews,
}: {
  pendingReviews: PendingReviewRow[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(reviewId: string) {
    setLoadingId(reviewId);
    setError(null);
    try {
      await apiPost(`/api/dashboard/reviews/${reviewId}/approve`);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed"));
    } finally {
      setLoadingId(null);
    }
  }

  async function handleFlag(reviewId: string) {
    if (!confirm("Flag this review for admin? Use this if the review seems unfair or unrelated. An admin will review it.")) return;
    setLoadingId(reviewId);
    setError(null);
    try {
      await apiPost(`/api/dashboard/reviews/${reviewId}/flag`);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed"));
    } finally {
      setLoadingId(null);
    }
  }

  async function handleMessage(reviewId: string) {
    setLoadingId(reviewId);
    setError(null);
    try {
      const data = await apiPost<{ conversationId: string }>(`/api/dashboard/reviews/${reviewId}/message`);
      router.push(`/dashboard/messages?conversation=${data.conversationId}`);
    } catch (e) {
      setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed"));
    } finally {
      setLoadingId(null);
    }
  }

  if (pendingReviews.length === 0) {
    return (
      <p className="mt-8 rounded-xl border border-brand/20 bg-white p-6 text-brand/70">
        No pending reviews. When buyers leave a review, it appears here until you approve it, flag it for admin, or message the customer to resolve concerns.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {error && (
        <InlineAlert variant="error" className="mb-4" role="alert">
          {error}
        </InlineAlert>
      )}

      <ul className="space-y-6">
        {pendingReviews.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-brand">
                  {r.reviewer.name ?? r.reviewer.email ?? "Customer"}
                </p>
                <p className="mt-1 text-sm text-brand/70">
                  {new Date(r.createdAt).toLocaleDateString()}
                  {r.rating != null && (
                    <span className="ml-2">Rating: {r.rating}/5</span>
                  )}
                </p>
                <p className="mt-3 text-brand/90">{r.comment}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-brand/10 pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-brand/70">
                What would you like to do?
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleApprove(r.id)}
                    disabled={loadingId === r.id}
                    className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loadingId === r.id ? "…" : "Approve"}
                  </button>
                  <span className="text-xs text-brand/60">
                    Makes the review public immediately. Choose this when the review is fair and you&apos;re happy for others to see it.
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleFlag(r.id)}
                    disabled={loadingId === r.id}
                    className="rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                  >
                    {loadingId === r.id ? "…" : "Flag"}
                  </button>
                  <span className="text-xs text-brand/60">
                    Sends this review to admin for review. Use if it seems unfair, off-topic, or unrelated to the order.
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMessage(r.id)}
                    disabled={loadingId === r.id}
                    className="rounded border border-brand/30 px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-50"
                  >
                    {loadingId === r.id ? "…" : "Message"}
                  </button>
                  <span className="text-xs text-brand/60">
                    Opens a private chat with the customer to resolve concerns. After you talk, we&apos;ll prompt them to optionally update their review.
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-sm text-brand/70">
        <Link href="/dashboard/messages" className="text-brand-accent hover:underline">
          Go to Messages
        </Link>
        {" "}
        to see all conversations.
      </p>
    </div>
  );
}
