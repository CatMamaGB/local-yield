"use client";

/**
 * Admin reviews list with Hide action. Calls POST /api/admin/reviews/[id]/hide.
 */

import { useRouter } from "next/navigation";
import Link from "next/link";

export interface AdminReviewRow {
  id: string;
  comment: string;
  rating: number | null;
  producerResponse: string | null;
  resolved: boolean;
  hiddenByAdmin: boolean;
  createdAt: string;
  reviewerName: string;
  producerName: string;
  /** Order id (market) or care booking id; null for legacy/CARE without link. */
  orderId: string | null;
  type?: "MARKET" | "CARE";
}

export function AdminReviewsClient({
  reviews,
  includeHidden,
}: {
  reviews: AdminReviewRow[];
  includeHidden: boolean;
}) {
  const router = useRouter();

  async function handleHide(reviewId: string) {
    if (!confirm("Hide this review from public view?")) return;
    const res = await fetch(`/api/admin/reviews/${reviewId}/hide`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to hide");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-brand/20 bg-white shadow-sm">
      {reviews.length === 0 ? (
        <p className="p-6 text-brand/70">No reviews{includeHidden ? "" : " (hidden reviews excluded)"}.</p>
      ) : (
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand/20 bg-brand-light/50">
              <th className="py-3 pl-4 font-display font-semibold text-brand">Review</th>
              <th className="py-3 font-display font-semibold text-brand w-20">Rating</th>
              <th className="py-3 font-display font-semibold text-brand">Reviewer / Producer</th>
              <th className="py-3 font-display font-semibold text-brand w-24">Status</th>
              <th className="py-3 pr-4 font-display font-semibold text-brand w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-b border-brand/10">
                <td className="py-3 pl-4">
                  <p className="font-medium text-brand line-clamp-2">{r.comment}</p>
                  {r.producerResponse && (
                    <p className="mt-1 text-brand/70 text-xs">Producer: {r.producerResponse}</p>
                  )}
                </td>
                <td className="py-3">{r.rating ?? "—"}</td>
                <td className="py-3">
                  {r.reviewerName} → {r.producerName}
                </td>
                <td className="py-3">
                  {r.hiddenByAdmin ? (
                    <span className="text-amber-700">Hidden</span>
                  ) : r.resolved ? (
                    <span className="text-green-700">Resolved</span>
                  ) : (
                    <span className="text-brand/70">Open</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {!r.hiddenByAdmin && (
                    <button
                      type="button"
                      onClick={() => handleHide(r.id)}
                      className="rounded bg-amber-100 px-2 py-1 text-sm font-medium text-amber-800 hover:bg-amber-200"
                    >
                      Hide
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="border-t border-brand/20 p-3 text-xs text-brand/60">
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
