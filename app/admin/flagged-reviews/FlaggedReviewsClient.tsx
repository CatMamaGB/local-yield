"use client";

/**
 * Admin flagged-reviews dashboard: Approve, Dismiss flag, Provide guidance, Contact buyer.
 * Fair process: producers protected; buyers have a path to be heard.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface FlaggedReviewRow {
  id: string;
  comment: string;
  rating: number | null;
  adminGuidance: string | null;
  createdAt: string;
  flaggedAt: string | null;
  reviewerName: string;
  reviewerEmail: string;
  producerName: string;
  orderId: string | null;
}

export function FlaggedReviewsClient({
  reviews,
}: {
  reviews: FlaggedReviewRow[];
}) {
  const router = useRouter();
  const [guidanceEdits, setGuidanceEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function handleDismiss(reviewId: string) {
    if (!confirm("Dismiss this flag? The review stays as-is (e.g. remains private).")) return;
    setLoading(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/dismiss-flag`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to dismiss flag");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleApprove(reviewId: string) {
    if (!confirm("Approve this review? It will be made public and the flag cleared.")) return;
    setLoading(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/approve-flag`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to approve");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveGuidance(reviewId: string) {
    const guidance = guidanceEdits[reviewId] ?? "";
    setLoading(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/guidance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guidance: guidance.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to save guidance");
        return;
      }
      setGuidanceEdits((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  function copyBuyerEmail(email: string) {
    navigator.clipboard.writeText(email);
    // Optional: small toast; for now rely on user knowing they copied
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
        <p className="text-brand/70">No flagged reviews. Producers can flag reviews for admin review from their dashboard.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {reviews.map((r) => (
        <article
          key={r.id}
          className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-brand">Review</p>
              <p className="mt-1 text-brand/90">{r.comment}</p>
              <p className="mt-1 text-sm text-brand/70">
                Rating: {r.rating ?? "—"} · Flagged {r.flaggedAt ? new Date(r.flaggedAt).toLocaleDateString() : "—"}
              </p>
              <p className="mt-1 text-sm text-brand/70">
                <strong>Buyer:</strong> {r.reviewerName} · <strong>Producer:</strong> {r.producerName}
                {r.orderId && ` · Order: ${r.orderId}`}
              </p>
              {r.adminGuidance && (
                <p className="mt-2 rounded bg-brand-light/50 px-2 py-1 text-sm text-brand/80">
                  Platform note: {r.adminGuidance}
                </p>
              )}
            </div>
          </div>

          {/* Guidance */}
          <div className="mt-3 border-t border-brand/10 pt-3">
            <label className="block text-sm font-medium text-brand/80">Add or edit guidance (visible to producer/buyer)</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                className="min-w-0 flex-1 rounded border border-brand/20 px-3 py-1.5 text-sm"
                placeholder="e.g. Please keep feedback constructive; buyer can contact support if unresolved."
                value={guidanceEdits[r.id] ?? r.adminGuidance ?? ""}
                onChange={(e) =>
                  setGuidanceEdits((prev) => ({ ...prev, [r.id]: e.target.value }))
                }
              />
              <button
                type="button"
                disabled={loading === r.id}
                onClick={() => handleSaveGuidance(r.id)}
                className="rounded bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/20 disabled:opacity-50"
              >
                {loading === r.id ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading === r.id}
              onClick={() => handleApprove(r.id)}
              className="rounded bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-200 disabled:opacity-50"
            >
              Approve (make public)
            </button>
            <button
              type="button"
              disabled={loading === r.id}
              onClick={() => handleDismiss(r.id)}
              className="rounded bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/20 disabled:opacity-50"
            >
              Dismiss flag
            </button>
            <a
              href={`mailto:${r.reviewerEmail}`}
              className="inline-flex items-center rounded bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200"
            >
              Email buyer
            </a>
            <button
              type="button"
              onClick={() => copyBuyerEmail(r.reviewerEmail)}
              className="rounded border border-brand/20 px-3 py-1.5 text-sm text-brand/80 hover:bg-brand/5"
            >
              Copy buyer email
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
