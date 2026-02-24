/**
 * Admin layout: shared nav. Auth enforced; non-admins redirected to /admin/forbidden.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/authz/client";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=" + encodeURIComponent("/admin"));
  const { canAdmin } = getUserCapabilities(user);
  if (!canAdmin) redirect("/admin/forbidden");

  return (
    <div className="min-h-screen bg-brand-light">
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
