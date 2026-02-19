/**
 * Admin: Platform analytics. Admin only.
 */

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AnalyticsClient } from "./AnalyticsClient";

export default async function AdminAnalyticsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-brand leading-tight">Admin: Analytics</h1>
      <p className="mt-2 text-brand/80 leading-relaxed">Platform-wide metrics.</p>
      <div className="mt-8">
        <AnalyticsClient />
      </div>
    </div>
  );
}
