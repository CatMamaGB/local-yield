/**
 * Producer dashboard: products list, add, edit, delete. Producer or Admin only.
 * Unauthenticated → login with return URL. Authenticated but not producer → onboarding so they can add seller role.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/authz/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductsClient } from "./ProductsClient";

export default async function DashboardProductsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login?next=" + encodeURIComponent("/dashboard/products"));
  }
  const canSell = getUserCapabilities(user).canSell;
  if (!canSell) {
    redirect("/auth/onboarding?next=" + encodeURIComponent("/dashboard/products"));
  }
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PageHeader title="Products" />
        <ProductsClient />
      </div>
    </div>
  );
}
