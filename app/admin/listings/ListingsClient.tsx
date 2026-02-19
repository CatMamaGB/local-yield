"use client";

/**
 * Admin listings list client component.
 */

import { useState, useEffect } from "react";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface Listing {
  id: string;
  type: "market" | "care";
  title: string;
  active: boolean;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

export function ListingsClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchListings();
  }, [typeFilter, activeFilter, search]);

  async function fetchListings() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append("type", typeFilter);
      if (activeFilter !== "") params.append("active", activeFilter);
      if (search) params.append("q", search);
      params.append("limit", "100");

      const data = await apiGet<{ listings: Listing[] }>(`/api/admin/listings?${params.toString()}`);
      setListings(data.listings);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to load listings"));
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
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title..."
          className="flex-1 min-w-[200px] rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        >
          <option value="">All types</option>
          <option value="market">Market</option>
          <option value="care">Care</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {listings.length === 0 ? (
        <p className="text-brand/80">No listings found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand/10 bg-brand-light/40">
                <th className="py-3 pl-4 text-left font-display font-semibold text-brand">Type</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Title</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Creator</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Status</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Created</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b border-brand/10">
                  <td className="py-3 pl-4">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-brand-light text-brand">
                      {listing.type}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="text-sm font-medium text-brand">{listing.title}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand">{listing.creator.name || listing.creator.email}</div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        listing.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {listing.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand/80">
                      {new Date(listing.createdAt).toLocaleDateString()}
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
