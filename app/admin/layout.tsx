/**
 * Admin layout: shared nav (Back to Dashboard + Reviews, Flagged reviews, Users, Listings, Custom categories).
 * Auth enforced here so non-admins never see the admin shell (Navbar + AdminNav).
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/authz";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { canAdmin } = getUserCapabilities(user);
  if (!canAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-brand-light">
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
