"use client";

/**
 * Market home search card: category-first (optional, default All), ZIP + radius, optional q.
 * CTA: "Browse [Label]" when category/group selected, else "Browse near me".
 * Navigates to /market/browse with group, category, zip, radius, q.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_CATEGORY_GROUPS } from "@/lib/product-categories";
import { RADIUS_OPTIONS } from "@/lib/geo/constants";
import { buildSearchUrl } from "@/lib/search/url";
import { SEARCH_KEYS } from "@/lib/search/keys";

export function MarketHomeSearchCard() {
  const router = useRouter();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(25);
  const [q, setQ] = useState("");

  const selectedGroup = selectedGroupId
    ? PRODUCT_CATEGORY_GROUPS.find((g) => g.id === selectedGroupId)
    : null;
  const subcategories = selectedGroup?.subcategories ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedZip = zip.trim().replace(/\D/g, "").slice(0, 5);
    const params: Record<string, string | number | undefined> = {
      [SEARCH_KEYS.RADIUS]: radius,
      [SEARCH_KEYS.QUERY]: q.trim() || undefined,
    };
    if (trimmedZip.length === 5) params[SEARCH_KEYS.ZIP] = trimmedZip;
    if (selectedCategoryId) params[SEARCH_KEYS.CATEGORY] = selectedCategoryId;
    else if (selectedGroupId) params[SEARCH_KEYS.GROUP] = selectedGroupId;

    const url = buildSearchUrl("/market/browse", params);
    router.push(url);
  }

  const ctaLabel =
    selectedCategoryId && selectedGroup
      ? selectedGroup.subcategories.find((s) => s.id === selectedCategoryId)?.label ?? selectedGroup.label
      : selectedGroup
        ? selectedGroup.label
        : "near me";
  const ctaText = ctaLabel === "near me" ? "Browse near me" : `Browse ${ctaLabel}`;

  return (
    <div className="w-full max-w-2xl rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand">
            What are you looking for?
          </h2>
          <p className="mt-1 text-sm text-brand/70">
            Pick a category (optional), enter your ZIP, then browse.
          </p>
        </div>

        {/* Category: All categories default */}
        <div>
          <p className="text-sm font-medium text-brand mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedGroupId(null);
                setSelectedCategoryId(null);
              }}
              className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
                !selectedGroupId
                  ? "border-brand-accent bg-brand-light text-brand"
                  : "border-brand/20 bg-white text-brand/80 hover:border-brand-accent/40"
              }`}
            >
              All categories
            </button>
            {PRODUCT_CATEGORY_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setSelectedCategoryId(null);
                }}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
                  selectedGroupId === group.id && !selectedCategoryId
                    ? "border-brand-accent bg-brand-light text-brand"
                    : selectedGroupId === group.id
                      ? "border-brand/40 bg-brand-light/60 text-brand"
                      : "border-brand/20 bg-white text-brand/80 hover:border-brand-accent/40"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
          {subcategories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(sub.id)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
                    selectedCategoryId === sub.id
                      ? "border-brand-accent bg-brand-light text-brand"
                      : "border-brand/20 bg-white text-brand/80 hover:border-brand-accent/40"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ZIP + radius */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-5">
            <label htmlFor="market-home-zip" className="sr-only">
              ZIP code
            </label>
            <input
              id="market-home-zip"
              type="text"
              inputMode="numeric"
              placeholder="Enter ZIP code"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              maxLength={5}
              className="w-full rounded-lg border border-brand/20 bg-white px-4 py-3 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            />
          </div>
          <div className="sm:col-span-4">
            <label htmlFor="market-home-radius" className="block text-sm font-medium text-brand mb-1">
              Distance (miles)
            </label>
            <select
              id="market-home-radius"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full rounded-lg border border-brand/20 bg-white px-4 py-3 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            >
              {RADIUS_OPTIONS.map((miles) => (
                <option key={miles} value={miles}>
                  {miles} miles
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-farmhouse transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              {ctaText}
            </button>
          </div>
        </div>

        {/* Optional keyword */}
        <div>
          <label htmlFor="market-home-q" className="block text-sm font-medium text-brand mb-1">
            Search by keyword (optional)
          </label>
          <input
            id="market-home-q"
            type="search"
            placeholder="e.g. eggs, honey, bread"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-brand/20 bg-white px-4 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>
      </form>
    </div>
  );
}
