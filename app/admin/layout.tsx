/**
 * Admin layout: shared nav. Auth enforced; non-admins see 403 view (no redirect loop).
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/authz/client";
import { AdminNav } from "./AdminNav";

function AdminForbiddenView() {
  return (
    <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full rounded-xl border border-brand/20 bg-white p-8 shadow-farmhouse text-center">
        <h1 className="font-display text-2xl font-semibold text-brand">
          You don&apos;t have access to Admin
        </h1>
        <p className="mt-3 text-brand/80">
          Admin is only available to users with admin permissions.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white shadow-farmhouse transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=" + encodeURIComponent("/admin"));
  const { canAdmin } = getUserCapabilities(user);
  if (!canAdmin) return <AdminForbiddenView />;

  return (
    <div className="min-h-screen bg-brand-light">
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
