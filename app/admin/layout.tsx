/**
 * Admin layout: shared nav. Auth enforced for all routes except /admin/login (handled in AdminLayoutClient).
 * Server-side defense-in-depth: redirect signed-in non-admin users to /admin/forbidden.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/authz/client";
import { AdminLayoutClient } from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) {
    const { canAdmin } = getUserCapabilities(user);
    if (!canAdmin) {
      redirect("/admin/forbidden");
    }
  }
  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
