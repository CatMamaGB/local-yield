/**
 * Admin: listings moderation. Admin only; others redirected to dashboard.
 */

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminListingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Admin: Listings</h1>
        <p className="mt-2 text-brand/80">Moderate products and shops. (TODO: protect + data)</p>
      </div>
    </div>
  );
}
