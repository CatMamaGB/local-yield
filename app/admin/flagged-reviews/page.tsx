/**
 * Admin: flagged reviews dashboard. Producers are protected from unfair reviews;
 * buyers have a path to be heard (escalation, guidance, update after resolution).
 */

import { redirect } from "next/navigation";
import Link from "next/link";
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
  }));

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-display text-2xl font-semibold text-brand">
            Admin: Flagged reviews
          </h1>
          <Link href="/admin/reviews" className="text-brand-accent hover:underline">
            All reviews
          </Link>
          <Link href="/admin/users" className="text-brand-accent hover:underline">
            Users
          </Link>
          <Link href="/admin/listings" className="text-brand-accent hover:underline">
            Listings
          </Link>
        </div>
        <p className="mt-2 text-brand/80">
          Balance fairness: protect producers from unfair or off-topic reviews; ensure buyers can
          escalate and be heard. Approve fair reviews, dismiss unwarranted flags, add guidance, or
          contact the buyer when escalation is needed.
        </p>
        <FlaggedReviewsClient reviews={rows} />
      </div>
    </div>
  );
}
