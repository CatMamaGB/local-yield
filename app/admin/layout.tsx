/**
 * Admin layout: shared nav. Auth enforced for all routes except /admin/login (handled in AdminLayoutClient).
 */

import { getCurrentUser } from "@/lib/auth";
import { AdminLayoutClient } from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
