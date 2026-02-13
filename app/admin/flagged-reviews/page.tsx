/**
 * Admin: flagged reviews dashboard. Producers are protected from unfair reviews;
 * buyers have a path to be heard (escalation, guidance, update after resolution).
 */

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getFlaggedReviewsForAdmin } from "@/lib/reviews";
import { FlaggedReviewsClient } from "./FlaggedReviewsClient";

export default async function AdminFlaggedReviewsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }
  const reviews = await getFlaggedReviewsForAdmin();
  const rows = reviews.map((r) => ({
    id: r.id,
    comment: r.comment,
    rating: r.rating,
    adminGuidance: r.adminGuidance,
    createdAt: r.createdAt.toISOString(),
    flaggedAt: r.flaggedAt?.toISOString() ?? null,
    reviewerName: r.reviewer.name ?? r.reviewer.email,
    reviewerEmail: r.reviewer.email,
    producerName: r.producer?.name ?? r.producer?.email ?? "—",
    orderId: r.order?.id ?? null,
    type: r.type ?? "MARKET",
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-brand leading-tight">
        Admin: Flagged reviews
      </h1>
      <p className="mt-2 text-brand/80 leading-relaxed">
        Balance fairness: protect producers from unfair or off-topic reviews; ensure buyers can
        escalate and be heard. Approve fair reviews, dismiss unwarranted flags, add guidance, or
          contact the buyer when escalation is needed.
      </p>
      <FlaggedReviewsClient reviews={rows} />
    </div>
  );
}
