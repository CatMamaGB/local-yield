"use client";

/**
 * Browse client: ZIP, radius, search term.
 * Fetches /api/listings, separates nearby vs fartherOut, displays with labels.
 */

import { useState, useEffect, useCallback } from "react";
import { LocationInput } from "./LocationInput";
import { ListingRow } from "./ListingRow";
import type { BrowseListing, ListingsResponse } from "@/types/listings";

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
      const res = await fetch(`/api/listings?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load listings");
      const json: ListingsResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
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
      <div className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand">
          Your location
        </h2>
        <p className="mt-1 text-sm text-brand/80">
          Set your ZIP and radius to see distance and &quot;Nearby&quot; / &quot;Farther Out&quot; labels.
        </p>
        <div className="mt-4">
          <LocationInput
            defaultZip={zip}
            onSelect={handleLocationSelect}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="search" className="sr-only">
          Search listings
        </label>
        <input
          id="search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search (e.g. eggs, veggie, honey)"
          className="w-64 rounded border border-brand/30 px-3 py-2 text-brand placeholder:text-brand/50"
        />
      </div>

      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {loading && (
        <p className="text-brand/70">Loading listings…</p>
      )}

      {!loading && data && (
        <>
          <div className="overflow-hidden rounded-xl border border-brand/20 bg-white shadow-sm">
            <table className="w-full min-w-[520px] table-fixed sm:table-auto">
              <thead>
                <tr className="border-b border-brand/20 bg-brand-light/50">
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
                {data.listings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-brand/70">
                      No listings match. Try a different ZIP, radius, or search.
                    </td>
                  </tr>
                ) : (
                  data.listings.map((listing) => (
                    <ListingRow key={listing.id} listing={listing} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-brand/70">
            <span className="font-medium text-green-700">Nearby 🟢</span> within {data.radiusMiles} mi
            {data.userZip && ` of ${data.userZip}`}.
            {" "}
            <span className="font-medium text-sky-700">Farther Out 🔵</span> outside your radius but still shown.
          </p>

          {/* Future: "Coming This Way Soon?" / "Order + Meet Here" for popups/events */}
          <p className="text-xs text-brand/50 italic">
            Coming soon: &quot;Order + Meet Here&quot; for pop-up events and meet-up locations.
          </p>
        </>
      )}
    </div>
  );
}
