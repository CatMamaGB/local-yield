"use client";

/**
 * Admin flagged-reviews dashboard: Approve, Dismiss flag, Provide guidance, Contact buyer.
 * Warm Farmhouse: Badge for MARKET/CARE, softer cards and buttons.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost, apiPatch } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { Badge, type BadgeType } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
  type?: "MARKET" | "CARE";
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
      await apiPost(`/api/admin/reviews/${reviewId}/dismiss-flag`);
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to dismiss flag"));
    } finally {
      setLoading(null);
    }
  }

  async function handleApprove(reviewId: string) {
    if (!confirm("Approve this review? It will be made public and the flag cleared.")) return;
    setLoading(reviewId);
    try {
      await apiPost(`/api/admin/reviews/${reviewId}/approve-flag`);
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to approve"));
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveGuidance(reviewId: string) {
    const guidance = guidanceEdits[reviewId] ?? "";
    setLoading(reviewId);
    try {
      await apiPatch(`/api/admin/reviews/${reviewId}/guidance`, { guidance: guidance.trim() || null });
      setGuidanceEdits((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to save guidance"));
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
      <div className="mt-6 rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
        <p className="text-brand/80 leading-relaxed">No flagged reviews. Producers and caregivers can flag reviews for admin review from their dashboard.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {reviews.map((r) => (
        <article
          key={r.id}
          className="rounded-xl border border-brand/10 bg-white p-5 shadow-farmhouse"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display font-semibold text-brand leading-tight">Review</p>
                <Badge variant={(r.type === "CARE" ? "CARE" : "MARKET") as BadgeType}>
                  {r.type ?? "MARKET"}
                </Badge>
              </div>
              <p className="mt-1 text-brand/90 leading-relaxed">{r.comment}</p>
              <p className="mt-1 text-sm text-brand/80">
                Rating: {r.rating ?? "—"} · Flagged {r.flaggedAt ? new Date(r.flaggedAt).toLocaleDateString() : "—"}
              </p>
              <p className="mt-1 text-sm text-brand/80">
                <strong>Reviewer:</strong> {r.reviewerName} · <strong>{r.type === "CARE" ? "Caregiver" : "Producer"}:</strong> {r.producerName}
                {r.orderId && ` · Order: ${r.orderId}`}
              </p>
              {r.adminGuidance && (
                <p className="mt-2 rounded-lg bg-brand-light/60 px-3 py-2 text-sm text-brand/80 leading-relaxed">
                  Platform note: {r.adminGuidance}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-brand/10 pt-4">
            <label htmlFor={`guidance-${r.id}`} className="block text-sm font-medium text-brand/80 mb-1.5">
              Add or edit guidance (visible to reviewee and reviewer)
            </label>
            <div className="flex gap-2 flex-wrap">
              <input
                id={`guidance-${r.id}`}
                type="text"
                className="min-w-0 flex-1 rounded-lg border border-brand/20 px-3 py-2 text-sm text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                placeholder="e.g. Please keep feedback constructive; buyer can contact support if unresolved."
                value={guidanceEdits[r.id] ?? r.adminGuidance ?? ""}
                onChange={(e) =>
                  setGuidanceEdits((prev) => ({ ...prev, [r.id]: e.target.value }))
                }
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading === r.id}
                onClick={() => handleSaveGuidance(r.id)}
              >
                {loading === r.id ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={loading === r.id}
              onClick={() => handleApprove(r.id)}
            >
              Approve (make public)
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loading === r.id}
              onClick={() => handleDismiss(r.id)}
            >
              Dismiss flag
            </Button>
            <a
              href={`mailto:${r.reviewerEmail}`}
              className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Email reviewer
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copyBuyerEmail(r.reviewerEmail)}
            >
              Copy reviewer email
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
