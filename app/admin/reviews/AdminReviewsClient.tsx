"use client";

/**
 * Admin reviews list with Hide action. Calls POST /api/admin/reviews/[id]/hide.
 * Warm Farmhouse: Badge for MARKET/CARE, softer table and buttons.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { Badge, type BadgeType } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface AdminReviewRow {
  id: string;
  comment: string;
  rating: number | null;
  producerResponse: string | null;
  resolved: boolean;
  hiddenByAdmin: boolean;
  flaggedForAdmin?: boolean;
  flaggedAt?: string | null;
  privateFlag?: boolean;
  createdAt: string;
  reviewerName: string;
  producerName: string;
  orderId: string | null;
  type?: "MARKET" | "CARE";
}

function HideReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onHide() {
    if (!confirm("Hide this review from public view?")) return;
    setError(null);
    setLoading(true);
    try {
      await apiPost(`/api/admin/reviews/${reviewId}/hide`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? apiErrorMessage(err) : err instanceof Error ? err.message : "Failed to hide review."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onHide}
        disabled={loading}
      >
        {loading ? "Hiding…" : "Hide"}
      </Button>
      {error ? <span className="text-xs text-brand-terracotta" role="alert">{error}</span> : null}
    </div>
  );
}

export function AdminReviewsClient({
  reviews,
  includeHidden,
}: {
  reviews: AdminReviewRow[];
  includeHidden: boolean;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse">
      {reviews.length === 0 ? (
        <p className="p-6 text-brand/80 leading-relaxed">No reviews{includeHidden ? "" : " (hidden reviews excluded)"}.</p>
      ) : (
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand/10 bg-brand-light/40">
              <th className="py-3 pl-4 font-display font-semibold text-brand">Review</th>
              <th className="py-3 font-display font-semibold text-brand w-20">Type</th>
              <th className="py-3 font-display font-semibold text-brand w-20">Rating</th>
              <th className="py-3 font-display font-semibold text-brand">Reviewer / Reviewee</th>
              <th className="py-3 font-display font-semibold text-brand w-24">Status</th>
              <th className="py-3 pr-4 font-display font-semibold text-brand w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-b border-brand/10 transition hover:bg-brand-light/30">
                <td className="py-3 pl-4">
                  <p className="font-medium text-brand line-clamp-2">{r.comment}</p>
                  {r.producerResponse && (
                    <p className="mt-1 text-brand/80 text-xs">Reviewee: {r.producerResponse}</p>
                  )}
                </td>
                <td className="py-3">
                  <Badge variant={(r.type === "CARE" ? "CARE" : "MARKET") as BadgeType}>
                    {r.type ?? "MARKET"}
                  </Badge>
                </td>
                <td className="py-3">{r.rating ?? "—"}</td>
                <td className="py-3">
                  {r.reviewerName} → {r.producerName}
                </td>
                <td className="py-3">
                  {r.hiddenByAdmin ? (
                    <span className="text-amber-700">Hidden</span>
                  ) : r.flaggedForAdmin ? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">Flagged by reviewee</span>
                  ) : r.resolved ? (
                    <span className="text-green-700">Resolved</span>
                  ) : (
                    <span className="text-brand/70">Open</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {!r.hiddenByAdmin && <HideReviewButton reviewId={r.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="border-t border-brand/10 p-3 text-xs text-brand/70 leading-relaxed">
        Toggle{" "}
        <Link
          href={includeHidden ? "/admin/reviews" : "/admin/reviews?showHidden=1"}
          className="text-brand-accent hover:underline"
        >
          {includeHidden ? "exclude" : "include"} hidden reviews
        </Link>
      </p>
    </div>
  );
}
