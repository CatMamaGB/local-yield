"use client";

/**
 * Admin help exchange postings list client component.
 */

import { useState, useEffect } from "react";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface Posting {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function HelpExchangeClient() {
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  useEffect(() => {
    fetchPostings();
  }, [statusFilter, categoryFilter]);

  async function fetchPostings() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (categoryFilter) params.append("category", categoryFilter);
      params.append("limit", "100");

      const data = await apiGet<{ postings: Posting[] }>(`/api/admin/help-exchange?${params.toString()}`);
      setPostings(data.postings);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to load postings"));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSkeleton rows={10} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="FILLED">Filled</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        >
          <option value="">All categories</option>
          <option value="FENCE_REPAIRS">Fence Repairs</option>
          <option value="GARDEN_HARVEST">Garden Harvest</option>
          <option value="EQUIPMENT_HELP">Equipment Help</option>
        </select>
      </div>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {postings.length === 0 ? (
        <p className="text-brand/80">No postings found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand/10 bg-brand-light/40">
                <th className="py-3 pl-4 text-left font-display font-semibold text-brand">Title</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Category</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Creator</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Status</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Created</th>
              </tr>
            </thead>
            <tbody>
              {postings.map((posting) => (
                <tr key={posting.id} className="border-b border-brand/10">
                  <td className="py-3 pl-4">
                    <div className="text-sm font-medium text-brand">{posting.title}</div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-brand-light text-brand">
                      {posting.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand">{posting.createdBy.name || posting.createdBy.email}</div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-brand-light text-brand">
                      {posting.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand/80">
                      {new Date(posting.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
