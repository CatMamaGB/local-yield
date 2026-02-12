"use client";

/**
 * Admin: Custom Category Review — list pending custom categories with Approve, Edit, Reject.
 * Pagination and search; recent action log for audit.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export interface PendingCustomCategoryRow {
  id: string;
  name: string;
  correctedName: string | null;
  status: string;
  groupId: string | null;
  defaultImageUrl: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
}

export interface ActionLogEntry {
  id: string;
  action: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  performedBy: { id: string; name: string | null; email: string };
}

export function AdminCustomCategoriesClient({
  customCategories,
  total,
  page,
  limit,
  totalPages,
  initialSearch,
  actionLogs,
}: {
  customCategories: PendingCustomCategoryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  initialSearch: string;
  actionLogs: ActionLogEntry[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [editOnlyId, setEditOnlyId] = useState<string | null>(null);
  const [correctedName, setCorrectedName] = useState("");
  const [editOnlyName, setEditOnlyName] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function buildUrl(updates: { page?: number; search?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    if (updates.page != null) p.set("page", String(updates.page));
    if (updates.search !== undefined) {
      if (updates.search) p.set("search", updates.search);
      else p.delete("search");
    }
    return `/admin/custom-categories?${p.toString()}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ page: 1, search: searchInput.trim() || "" }));
  }

  async function handleApprove(id: string, correctedNameValue?: string | null) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/custom-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          correctedName: correctedNameValue != null ? correctedNameValue.trim() || null : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to approve");
      }
      setCorrectingId(null);
      setCorrectedName("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Reject this category? It will be removed from the producer’s list and not shown to anyone.")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/custom-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to reject");
      }
      setCorrectingId(null);
      setEditOnlyId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleEditOnly(id: string, correctedNameValue: string) {
    const name = correctedNameValue.trim();
    if (!name) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/custom-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctedName: name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save edit");
      }
      setEditOnlyId(null);
      setEditOnlyName("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      {/* Search and pagination */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-brand/20 bg-white p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <label htmlFor="admin-cat-search" className="sr-only">
            Search by category name or producer email
          </label>
          <input
            id="admin-cat-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or producer email…"
            className="rounded border border-brand/30 px-3 py-2 text-sm text-brand w-64"
          />
          <button type="submit" className="rounded bg-brand px-3 py-2 text-sm text-white hover:bg-brand/90">
            Search
          </button>
        </form>
        <div className="text-sm text-brand/70">
          {total} pending{totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
        </div>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <Link
              href={buildUrl({ page: page - 1 })}
              className={`rounded border px-3 py-1.5 text-sm ${page <= 1 ? "pointer-events-none border-brand/20 text-brand/40" : "border-brand/30 text-brand hover:bg-brand-light"}`}
            >
              Previous
            </Link>
            <Link
              href={buildUrl({ page: page + 1 })}
              className={`rounded border px-3 py-1.5 text-sm ${page >= totalPages ? "pointer-events-none border-brand/20 text-brand/40" : "border-brand/30 text-brand hover:bg-brand-light"}`}
            >
              Next
            </Link>
          </div>
        )}
      </div>

      {/* Pending list */}
      <div className="overflow-hidden rounded-xl border border-brand/20 bg-white shadow-sm">
        {customCategories.length === 0 ? (
          <p className="p-6 text-brand/70">
            No pending custom categories{initialSearch ? " matching your search." : "."}
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand/20 bg-brand-light/50">
                <th className="py-3 pl-4 font-display font-semibold text-brand">Category name</th>
                <th className="py-3 font-display font-semibold text-brand">Submitted by</th>
                <th className="py-3 font-display font-semibold text-brand">Date</th>
                <th className="py-3 pr-4 font-display font-semibold text-brand w-56">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customCategories.map((c) => (
                <tr key={c.id} className="border-b border-brand/10">
                  <td className="py-3 pl-4">
                    <span className="font-medium text-brand">{c.name}</span>
                    {c.correctedName && (
                      <span className="ml-2 text-xs text-brand/60">→ {c.correctedName}</span>
                    )}
                    {c.groupId && (
                      <span className="ml-2 text-xs text-brand/60">(group: {c.groupId})</span>
                    )}
                    {correctingId === c.id ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={correctedName}
                          onChange={(e) => setCorrectedName(e.target.value)}
                          placeholder="Corrected name"
                          className="rounded border border-brand/30 px-2 py-1 text-brand"
                        />
                        <button
                          type="button"
                          onClick={() => handleApprove(c.id, correctedName)}
                          disabled={loadingId === c.id}
                          className="rounded bg-brand px-2 py-1 text-xs text-white hover:bg-brand/90 disabled:opacity-50"
                        >
                          Approve with correction
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCorrectingId(null); setCorrectedName(""); }}
                          className="text-xs text-brand/70 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
                    {editOnlyId === c.id ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={editOnlyName}
                          onChange={(e) => setEditOnlyName(e.target.value)}
                          placeholder="Corrected name (spelling)"
                          className="rounded border border-brand/30 px-2 py-1 text-brand"
                        />
                        <button
                          type="button"
                          onClick={() => handleEditOnly(c.id, editOnlyName)}
                          disabled={loadingId === c.id || !editOnlyName.trim()}
                          className="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                          Save edit
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditOnlyId(null); setEditOnlyName(""); }}
                          className="text-xs text-brand/70 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3">
                    {c.createdBy
                      ? `${c.createdBy.name ?? c.createdBy.email} (${c.createdBy.email})`
                      : "—"}
                  </td>
                  <td className="py-3 text-brand/70">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">
                    {correctingId === c.id || editOnlyId === c.id ? null : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(c.id)}
                          disabled={loadingId === c.id}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {loadingId === c.id ? "…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCorrectingId(c.id); setCorrectedName(c.correctedName ?? c.name); setEditOnlyId(null); }}
                          disabled={loadingId === c.id}
                          className="rounded border border-brand/30 px-2 py-1 text-xs text-brand hover:bg-brand-light disabled:opacity-50"
                        >
                          Correct & approve
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditOnlyId(c.id); setEditOnlyName(c.correctedName ?? c.name); setCorrectingId(null); }}
                          disabled={loadingId === c.id}
                          className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                        >
                          Edit only
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(c.id)}
                          disabled={loadingId === c.id}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action log for audit */}
      <div className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand">Recent actions (audit log)</h2>
        <p className="mt-1 text-xs text-brand/70">
          Approve, reject, and edit actions on custom categories are logged for reference.
        </p>
        {actionLogs.length === 0 ? (
          <p className="mt-4 text-sm text-brand/60">No actions yet.</p>
        ) : (
          <ul className="mt-4 max-h-64 overflow-y-auto space-y-2 text-sm">
            {actionLogs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-baseline gap-2 border-b border-brand/10 pb-2">
                <span className="font-medium text-brand/80">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
                <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-xs">
                  {log.action.replace("CUSTOM_CATEGORY_", "")}
                </span>
                <span className="text-brand/70">
                  by {log.performedBy.name ?? log.performedBy.email}
                </span>
                {log.details && typeof log.details === "object" && (
                  <span className="text-brand/60">
                    {log.details.name != null && `"${log.details.name}"`}
                    {log.details.correctedName != null && ` → "${log.details.correctedName}"`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
