/**
 * Producer: pending reviews — Approve, Flag, or Message.
 * Clear explanations; balanced approach note.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProducerOrAdmin } from "@/lib/auth";
import { getPendingReviewsForProducer } from "@/lib/reviews";
import { ProducerReviewsClient } from "./ProducerReviewsClient";

export default async function DashboardReviewsPage() {
  let user;
  try {
    user = await requireProducerOrAdmin();
  } catch {
    redirect("/dashboard");
  }

  const pendingReviews = await getPendingReviewsForProducer(user.id);

  const list = pendingReviews.map((r) => ({
    id: r.id,
    comment: r.comment,
    rating: r.rating,
    producerResponse: r.producerResponse,
    resolved: r.resolved,
    createdAt: r.createdAt.toISOString(),
    reviewer: r.reviewer,
    orderId: r.order?.id ?? null,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand">Review management</h1>
      <p className="mt-2 text-brand/80">
        Pending reviews are visible only to you until you approve them or they are resolved. Choose how to handle each one below.
      </p>

      {/* How reviews work */}
      <section className="mt-6 rounded-xl border border-brand/20 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brand">How reviews work</h2>
        <div className="mt-4 space-y-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
              <span className="text-lg font-semibold text-green-800">✓</span>
            </div>
            <div>
              <h3 className="font-medium text-brand">Approve</h3>
              <p className="mt-1 text-sm text-brand/80">
                Publishes the review immediately. It will appear on your storefront and the buyer&apos;s order page.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-lg font-semibold text-blue-800">💬</span>
            </div>
            <div>
              <h3 className="font-medium text-brand">Message</h3>
              <p className="mt-1 text-sm text-brand/80">
                Opens a private conversation with the buyer. The review stays private while you resolve their concern. After resolution, you can approve or the buyer can update their review.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
              <span className="text-lg font-semibold text-yellow-800">⚠</span>
            </div>
            <div>
              <h3 className="font-medium text-brand">Flag</h3>
              <p className="mt-1 text-sm text-brand/80">
                Sends the review to admin for evaluation. The review stays private until an admin reviews it. Use this if the review seems unfair, off-topic, or violates guidelines.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-lg bg-brand-light/50 p-4">
          <p className="text-sm font-medium text-brand">What buyers see</p>
          <p className="mt-1 text-xs text-brand/70">
            Buyers see when their review is <strong>Pending</strong> (awaiting your action), <strong>Published</strong> (approved and visible to all), or <strong>Under review</strong> (flagged for admin evaluation).
          </p>
        </div>
      </section>

      {/* Balanced approach note */}
      <section className="mt-6 rounded-xl border border-brand/20 bg-brand-light/30 p-4">
        <h2 className="font-display text-sm font-semibold text-brand">Our balanced approach</h2>
        <p className="mt-2 text-sm text-brand/80">
          We protect producers from unfair or unrelated reviews while ensuring every buyer&apos;s voice is heard constructively. 
          Reviews go public after you approve them or after resolution (for example, after a message exchange with the customer). 
          If a review seems unfair or off-topic, you can flag it for admin review.
        </p>
      </section>

      <ProducerReviewsClient pendingReviews={list} />
    </div>
  );
}
