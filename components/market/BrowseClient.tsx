"use client";

/**
 * Browse client: URL-driven filters (group, category, view, map, sort, zip, radius, q).
 * Products | Producers toggle; category chips; sort; empty state with radius chips and "browse all categories".
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { LocationInput } from "../LocationInput";
import { ListingRow } from "./ListingRow";
import type { BrowseListing, ListingsResponse } from "@/types/listings";
import { parseMarketSearchParams } from "@/lib/search/market";
import { buildSearchUrl } from "@/lib/search/url";
import { SEARCH_KEYS } from "@/lib/search/keys";
import { PRODUCT_CATEGORY_GROUPS } from "@/lib/product-categories";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { RADIUS_OPTIONS } from "@/lib/geo/constants";
import { formatPrice } from "@/lib/utils";

export function BrowseClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const parsed = parseMarketSearchParams(searchParams);
  const [zip, setZip] = useState(parsed.zip ?? "");
  const [radius, setRadius] = useState(parsed.radius);
  const [search, setSearch] = useState(parsed.q ?? "");
  const [searchDebounced, setSearchDebounced] = useState(parsed.q ?? "");
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const view = parsed.view;
  const sort = parsed.sort;
  const group = parsed.group;
  const category = parsed.category;

  const buildBrowseUrl = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      return buildSearchUrl("/market/browse", {
        [SEARCH_KEYS.ZIP]: (updates.zip ?? zip) || undefined,
        [SEARCH_KEYS.RADIUS]: updates.radius ?? radius,
        [SEARCH_KEYS.QUERY]: (updates.q ?? searchDebounced) || undefined,
        [SEARCH_KEYS.GROUP]: updates.group ?? group ?? undefined,
        [SEARCH_KEYS.CATEGORY]: updates.category ?? category ?? undefined,
        [SEARCH_KEYS.VIEW]: updates.view ?? view,
        [SEARCH_KEYS.MAP]: updates.map ?? (parsed.map ? "1" : undefined),
        [SEARCH_KEYS.SORT]: updates.sort ?? sort,
      });
    },
    [zip, radius, searchDebounced, group, category, view, parsed.map, sort]
  );

  useEffect(() => {
    const urlParsed = parseMarketSearchParams(searchParams);
    setZip(urlParsed.zip ?? "");
    setRadius(urlParsed.radius);
    setSearch(urlParsed.q ?? "");
    setSearchDebounced(urlParsed.q ?? "");
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildSearchUrl("/api/listings", {
        [SEARCH_KEYS.ZIP]: zip || undefined,
        [SEARCH_KEYS.RADIUS]: radius,
        [SEARCH_KEYS.QUERY]: searchDebounced || undefined,
        [SEARCH_KEYS.GROUP]: group || undefined,
        [SEARCH_KEYS.CATEGORY]: category || undefined,
        [SEARCH_KEYS.SORT]: sort,
      });
      const payload = await apiGet<ListingsResponse>(url);
      setData(payload);
    } catch (e) {
      const msg = e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Something went wrong");
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [zip, radius, searchDebounced, group, category, sort]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Keep URL in sync when debounced search term changes
  useEffect(() => {
    const url = buildSearchUrl("/market/browse", {
      [SEARCH_KEYS.ZIP]: zip || undefined,
      [SEARCH_KEYS.RADIUS]: radius,
      [SEARCH_KEYS.QUERY]: searchDebounced || undefined,
      [SEARCH_KEYS.GROUP]: group || undefined,
      [SEARCH_KEYS.CATEGORY]: category || undefined,
      [SEARCH_KEYS.VIEW]: view,
      [SEARCH_KEYS.SORT]: sort,
    });
    router.replace(url, { scroll: false });
  }, [searchDebounced, zip, radius, group, category, view, sort]);

  const handleLocationSelect = (newZip: string, newRadius?: number) => {
    setZip(newZip);
    setRadius(newRadius ?? radius);
    const url = buildBrowseUrl({ zip: newZip || undefined, radius: newRadius ?? radius });
    router.replace(url, { scroll: false });
  };

  const handleRadiusChange = (r: number) => {
    setRadius(r);
    router.replace(buildBrowseUrl({ radius: r }), { scroll: false });
  };

  const setView = (v: "products" | "producers") => {
    router.replace(buildBrowseUrl({ view: v }), { scroll: false });
  };

  const setSort = (s: string) => {
    router.replace(buildBrowseUrl({ sort: s }), { scroll: false });
  };

  const setGroupCategory = (g: string | null, c?: string | null) => {
    router.replace(buildBrowseUrl({ group: g ?? undefined, category: c ?? undefined }), { scroll: false });
  };

  const listings = data?.listings ?? data?.items ?? [];
  const total = data?.total ?? listings.length;
  const radiusMiles = data?.radiusMiles ?? radius;
  const userZip = data?.userZip ?? zip;

  const groupedByProducer = (() => {
    const map = new Map<string, BrowseListing[]>();
    for (const item of listings) {
      const list = map.get(item.producerId) ?? [];
      list.push(item);
      map.set(item.producerId, list);
    }
    return Array.from(map.entries()).map(([producerId, items]) => {
      const first = items[0];
      const sorted = [...items].sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
      return {
        producerId,
        producerName: first.producerName ?? "Producer",
        zip: first.zip,
        distance: first.distance,
        items: sort === "most_items" ? items : sorted,
        productCount: items.length,
      };
    });
  })();

  if (view === "producers" && sort === "most_items") {
    groupedByProducer.sort((a, b) => b.productCount - a.productCount);
  } else {
    groupedByProducer.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }

  const emptyCopy =
    view === "producers"
      ? `No producers found within ${radiusMiles} miles. Try 50, 100, or 150 miles, or browse all categories.`
      : `No products found within ${radiusMiles} miles. Try 50, 100, or 150 miles, or browse all categories.`;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-brand/10 bg-white p-5 shadow-farmhouse sm:p-6">
        <h2 className="font-display text-xl font-semibold text-brand leading-tight">
          Your location
        </h2>
        <p className="mt-1.5 text-sm text-brand/80 leading-relaxed">
          Set your ZIP and radius to see distance and &quot;Nearby&quot; / &quot;Farther Out&quot; labels.
        </p>
        <div className="mt-5">
          <LocationInput
            defaultZip={zip}
            zip={zip}
            radius={radius}
            onRadiusChange={handleRadiusChange}
            onSelect={handleLocationSelect}
          />
        </div>
        <div className="mt-5 pt-5 border-t border-brand/10">
          <label htmlFor="search" className="block text-sm font-medium text-brand mb-1.5">
            Search listings
          </label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search (e.g. eggs, veggie, honey)"
            className="h-10 w-full max-w-md rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>

        {/* Category filter chips */}
        <div className="mt-5 pt-5 border-t border-brand/10">
          <p className="text-sm font-medium text-brand mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGroupCategory(null)}
              className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition ${
                !group && !category
                  ? "border-brand-accent bg-brand-light text-brand"
                  : "border-brand/20 bg-white text-brand/80 hover:border-brand-accent/40"
              }`}
            >
              All categories
            </button>
            {PRODUCT_CATEGORY_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroupCategory(g.id, undefined)}
                className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition ${
                  group === g.id && !category
                    ? "border-brand-accent bg-brand-light text-brand"
                    : "border-brand/20 bg-white text-brand/80 hover:border-brand-accent/40"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* View toggle + Sort */}
        <div className="mt-5 pt-5 border-t border-brand/10 flex flex-wrap items-center gap-4">
          <div className="flex rounded-lg border border-brand/20 p-0.5">
            <button
              type="button"
              onClick={() => setView("products")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === "products" ? "bg-brand-accent text-white" : "text-brand/80 hover:bg-brand-light"
              }`}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => setView("producers")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === "producers" ? "bg-brand-accent text-white" : "text-brand/80 hover:bg-brand-light"
              }`}
            >
              Producers
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="browse-sort" className="text-sm font-medium text-brand">
              Sort
            </label>
            <select
              id="browse-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-brand/20 bg-white px-3 py-1.5 text-sm text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            >
              {view === "products" ? (
                <>
                  <option value="distance">Closest</option>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="rating">Rating</option>
                </>
              ) : (
                <>
                  <option value="distance">Closest</option>
                  <option value="most_items">Most items</option>
                </>
              )}
            </select>
          </div>
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
          {listings.length === 0 ? (
            <div className="rounded-xl border border-brand/10 bg-white p-8 text-center shadow-farmhouse sm:p-10">
              <p className="font-display text-xl font-semibold text-brand leading-tight">
                {view === "producers" ? "No producers found" : "No products found"}
              </p>
              <p className="mt-2 text-sm text-brand/80 leading-relaxed">{emptyCopy}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {RADIUS_OPTIONS.filter((r) => r >= 50).map((miles) => (
                  <Link
                    key={miles}
                    href={buildBrowseUrl({ radius: miles })}
                    className="rounded-lg border-2 border-brand/30 bg-white px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light transition"
                  >
                    {miles} miles
                  </Link>
                ))}
                <Link
                  href={buildSearchUrl("/market/browse", {
                    [SEARCH_KEYS.ZIP]: zip || undefined,
                    [SEARCH_KEYS.RADIUS]: radius,
                    [SEARCH_KEYS.QUERY]: searchDebounced || undefined,
                    [SEARCH_KEYS.VIEW]: view,
                    [SEARCH_KEYS.SORT]: sort,
                  })}
                  className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent/90 transition"
                >
                  Browse all categories
                </Link>
              </div>
            </div>
          ) : view === "producers" ? (
            <div className="space-y-6">
              {groupedByProducer.map((producer) => (
                <div
                  key={producer.producerId}
                  className="rounded-xl border border-brand/10 bg-white p-5 shadow-farmhouse sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-brand">
                        {producer.producerName}
                      </h3>
                      <p className="text-sm text-brand/80">
                        {producer.zip}
                        {producer.distance != null && ` · ${producer.distance} mi`} · {producer.productCount} product{producer.productCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Link
                      href={`/market/shop/${producer.producerId}`}
                      className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent/90 transition"
                    >
                      View shop
                    </Link>
                  </div>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {producer.items.slice(0, 3).map((listing) => (
                      <li key={listing.id}>
                        <Link
                          href={`/market/shop/${producer.producerId}`}
                          className="block rounded-lg border border-brand/10 p-3 text-brand hover:bg-brand-light/40 transition"
                        >
                          <span className="font-medium">{listing.title}</span>
                          <span className="ml-2 text-sm text-brand/80">{formatPrice(listing.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
                    {listings.map((listing) => (
                      <ListingRow key={listing.id} listing={listing} />
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-brand/80 mt-4 leading-relaxed">
                <span className="font-medium text-emerald-700">Nearby</span> within {radiusMiles} mi
                {userZip && ` of ${userZip}`}.
                {" "}
                <span className="font-medium text-sky-700">Farther Out</span> outside your radius but still shown.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
