/**
 * Admin: review moderation. List reviews, filter by hidden, hide abusive content.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getReviewsForAdmin } from "@/lib/reviews";
import { AdminReviewsClient } from "./AdminReviewsClient";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ showHidden?: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }
  const { showHidden } = await searchParams;
  const includeHidden = showHidden === "1" || showHidden === "true";
  const reviews = await getReviewsForAdmin(includeHidden);
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-2xl font-semibold text-brand">
            Admin: Review moderation
          </h1>
          <Link
            href="/admin/users"
            className="text-brand-accent hover:underline"
          >
            Users
          </Link>
          <Link
            href="/admin/listings"
            className="text-brand-accent hover:underline"
          >
            Listings
          </Link>
        </div>
        <p className="mt-2 text-brand/80">
          Hide abusive or off-topic reviews. Resolution window applies to negative public reviews.
        </p>
        <AdminReviewsClient
          reviews={reviews.map((r) => ({
            id: r.id,
            comment: r.comment,
            rating: r.rating,
            producerResponse: r.producerResponse,
            resolved: r.resolved,
            hiddenByAdmin: r.hiddenByAdmin,
            createdAt: r.createdAt.toISOString(),
            reviewerName: r.reviewer.name ?? r.reviewer.email,
            producerName: r.producer.name ?? r.producer.id,
            orderId: r.order?.id ?? r.careBookingId ?? null,
            type: r.type,
          }))}
          includeHidden={includeHidden}
        />
      </div>
    </div>
  );
}
