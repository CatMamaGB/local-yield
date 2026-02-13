/**
 * Admin: user moderation. Admin only; others redirected to dashboard.
 */

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-brand leading-tight">Admin: Users</h1>
      <p className="mt-2 text-brand/80 leading-relaxed">User list and moderation. (TODO: protect + data)</p>
    </div>
  );
}
