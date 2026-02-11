/**
 * Producer dashboard: products list, add, edit, delete. Producer or Admin only.
 */

import { redirect } from "next/navigation";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ProductsClient } from "./ProductsClient";

export default async function DashboardProductsPage() {
  try {
    await requireProducerOrAdmin();
  } catch {
    redirect("/auth/login");
  }
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-brand">Products</h1>
        <ProductsClient />
      </div>
    </div>
  );
}
