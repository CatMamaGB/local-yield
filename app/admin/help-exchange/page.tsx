/**
 * Admin: Help Exchange postings list. Admin only; others redirected to dashboard.
 */

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { HelpExchangeClient } from "./HelpExchangeClient";

export default async function AdminHelpExchangePage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-brand leading-tight">Admin: Help Exchange</h1>
      <p className="mt-2 text-brand/80 leading-relaxed">View and manage help exchange postings.</p>
      <div className="mt-8">
        <HelpExchangeClient />
      </div>
    </div>
  );
}
