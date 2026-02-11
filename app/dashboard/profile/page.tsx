/**
 * Producer profile settings: name, bio, pickup notes, delivery settings.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ProducerProfileForm } from "@/components/ProducerProfileForm";

export default async function DashboardProfilePage() {
  try {
    await requireProducerOrAdmin();
  } catch {
    redirect("/auth/login");
  }
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Producer profile</h1>
        <p className="mt-2 text-brand/80">
          This is how you appear to buyers. Set pickup notes and delivery options.
        </p>
        <div className="mt-6 rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
          <ProducerProfileForm />
        </div>
        <p className="mt-4">
          <Link href="/dashboard" className="text-sm text-brand-accent hover:underline">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
