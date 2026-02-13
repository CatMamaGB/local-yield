/**
 * Admin: review moderation. List reviews, filter by hidden, hide abusive content.
 */

import { redirect } from "next/navigation";
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-brand leading-tight">
        Admin: Review moderation
      </h1>
      <p className="mt-2 text-brand/80 leading-relaxed">
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
            flaggedForAdmin: (r as { flaggedForAdmin?: boolean }).flaggedForAdmin ?? false,
            flaggedAt: (r as { flaggedAt?: Date | null }).flaggedAt?.toISOString() ?? null,
            privateFlag: (r as { privateFlag?: boolean }).privateFlag ?? true,
            createdAt: r.createdAt.toISOString(),
            reviewerName: r.reviewer.name ?? r.reviewer.email,
            producerName: r.producer.name ?? r.producer.id,
            orderId: r.order?.id ?? r.careBookingId ?? null,
            type: r.type,
          }))}
          includeHidden={includeHidden}
        />
    </div>
  );
}
