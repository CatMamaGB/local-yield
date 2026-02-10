/**
 * Producer dashboard: weekly box subscriptions. Producer or Admin only.
 */

import { redirect } from "next/navigation";
import { requireProducerOrAdmin } from "@/lib/auth";

export default async function DashboardSubscriptionsPage() {
  try {
    await requireProducerOrAdmin();
  } catch {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Subscriptions</h1>
        <p className="mt-2 text-brand/80">Weekly veggie box subscribers. (TODO: list + manage)</p>
      </div>
    </div>
  );
}
