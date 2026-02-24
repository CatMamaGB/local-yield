/**
 * Admin: Custom Category Review — pending custom categories from producers.
 * Approve (moves to public catalog), edit (fix spelling, stays pending), or reject.
 * Pagination and search; admin actions are logged for audit.
 */

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getPendingCustomCategoriesForAdmin,
  getCustomCategoryActionLogs,
} from "@/lib/catalog-categories";
import { AdminCustomCategoriesClient } from "./AdminCustomCategoriesClient";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;

export default async function AdminCustomCategoryReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const search = params.search?.trim() || undefined;

  const [result, actionLogs] = await Promise.all([
    getPendingCustomCategoriesForAdmin({ page, limit: DEFAULT_LIMIT, search }),
    getCustomCategoryActionLogs(50),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand">
        Custom Category Review
      </h1>
      <p className="mt-2 text-brand/80">
        Pending custom categories submitted by producers. <strong>Approve</strong> to move into the public catalog for all producers; <strong>Edit</strong> to fix spelling (stays pending); <strong>Reject</strong> to remove. All actions are logged.
      </p>
      <AdminCustomCategoriesClient
        customCategories={result.list}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        initialSearch={search ?? ""}
        actionLogs={actionLogs}
      />
    </div>
  );
}
