"use client";

/**
 * Browse client: ZIP, radius, search term.
 * Fetches /api/listings, separates nearby vs fartherOut, displays with labels.
 */

import { useState, useEffect, useCallback } from "react";
import { LocationInput } from "./LocationInput";
import { ListingRow } from "./ListingRow";
import type { BrowseListing, ListingsResponse } from "@/types/listings";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export function BrowseClient() {
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(25);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (zip) params.set("zip", zip.slice(0, 5));
      params.set("radius", String(radius));
      if (searchDebounced) params.set("q", searchDebounced);
      const payload = await apiGet<ListingsResponse>(`/api/listings?${params.toString()}`);
      setData(payload);
    } catch (e) {
      const msg = e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Something went wrong");
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [zip, radius, searchDebounced]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch when zip/radius/search change (initial load with no zip still fetches all)
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleLocationSelect = (newZip: string, newRadius?: number) => {
    setZip(newZip);
    if (newRadius != null) setRadius(newRadius);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-brand/10 bg-white p-5 shadow-farmhouse sm:p-6">
        <h2 className="font-display text-xl font-semibold text-brand leading-tight">
          Your location
        </h2>
        <p className="mt-1.5 text-sm text-brand/80 leading-relaxed">
          Set your ZIP and radius to see distance and &quot;Nearby&quot; / &quot;Farther Out&quot; labels.
        </p>
        <div className="mt-4">
          <LocationInput
            defaultZip={zip}
            onSelect={handleLocationSelect}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label htmlFor="search" className="sr-only">
            Search listings
          </label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search (e.g. eggs, veggie, honey)"
            className="w-full min-w-[200px] max-w-sm rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>
      </div>

      {error && (
        <InlineAlert variant="error" className="mb-4">
          {error}
        </InlineAlert>
      )}

      {loading && (
        <LoadingSkeleton rows={5} className="mt-4" />
      )}

      {!loading && data && (
        <>
          {data.listings.length === 0 ? (
            <EmptyState
              title="No listings match"
              body="Try a different ZIP, a larger radius, or a different search term."
              className="mt-4"
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse">
                <table className="w-full min-w-[520px] table-fixed sm:table-auto">
                  <thead>
                    <tr className="border-b border-brand/10 bg-brand-light/40">
                      <th className="py-3 pl-4 text-left font-display font-semibold text-brand">
                        Listing
                      </th>
                      <th className="py-3 text-center font-display font-semibold text-brand w-24">
                        Distance
                      </th>
                      <th className="py-3 pr-4 text-left font-display font-semibold text-brand w-32">
                        Label
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.listings.map((listing) => (
                      <ListingRow key={listing.id} listing={listing} />
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-brand/80 mt-4 leading-relaxed">
                <span className="font-medium text-emerald-700">Nearby</span> within {data.radiusMiles} mi
                {data.userZip && ` of ${data.userZip}`}.
                {" "}
                <span className="font-medium text-sky-700">Farther Out</span> outside your radius but still shown.
              </p>

              <p className="text-xs text-brand/60 italic mt-2">
                Coming soon: &quot;Order + Meet Here&quot; for pop-up events and meet-up locations.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
