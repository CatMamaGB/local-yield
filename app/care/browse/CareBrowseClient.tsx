"use client";

/**
 * Browse helpers: ZIP + category-first filters. Reads zip, radius, category from URL
 * via parseCareSearchParams. No search request when zip missing; category maps to serviceType for API.
 * When the user runs a search, we push a canonical URL (zip, radius, category) so the URL is the
 * single source of truth after search; refresh and back work correctly and sharing links is clean.
 */

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LocationInput } from "@/components/LocationInput";
import { parseCareSearchParams } from "@/lib/care/search-params";
import { categoryToServiceType, capabilityLabel, getCategoryLabel, type CareCategory } from "@/lib/care/categories";
import type { CaregiverBrowseItem, CaregiversBrowseResponse, CareSearchEcho } from "@/lib/care/types";
import { SERVICE_TYPE_LABELS, SPECIES_LABELS } from "@/lib/care/labels";
import { logCareSearch } from "@/lib/care/telemetry";
import { buildSearchUrl } from "@/lib/search/url";
import { SEARCH_KEYS } from "@/lib/search/keys";
import { listHelpExchangePostings, type HelpExchangePosting } from "@/lib/client/helpExchange";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateConversation } from "@/lib/messaging";
import { apiPost } from "@/lib/client/api-client";
import type { AnimalSpecies, CareServiceType, HelpExchangeCategory } from "@prisma/client";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

type BrowseView = "caregivers" | "help-exchange";

const HELP_EXCHANGE_CATEGORIES: { value: HelpExchangeCategory; label: string }[] = [
  { value: "FENCE_REPAIRS", label: "Fence Repairs" },
  { value: "GARDEN_HARVEST", label: "Garden Harvest" },
  { value: "EQUIPMENT_HELP", label: "Equipment Help" },
];

export function CareBrowseClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<BrowseView>("caregivers");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(25);
  const [category, setCategory] = useState<CareCategory | null>(null);
  const [helpExchangeCategory, setHelpExchangeCategory] = useState<HelpExchangeCategory | "">("");
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalSpecies | "">("");
  const [selectedServiceType, setSelectedServiceType] = useState<CareServiceType | "">("");
  const [caregivers, setCaregivers] = useState<CaregiverBrowseItem[]>([]);
  const [helpExchangePostings, setHelpExchangePostings] = useState<HelpExchangePosting[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [searchEcho, setSearchEcho] = useState<CareSearchEcho | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasValidZip = /^\d{5}$/.test(zip.trim());

  useEffect(() => {
    const parsed = parseCareSearchParams(searchParams);
    setZip(parsed.zip ?? "");
    setRadius(parsed.radius);
    setCategory(parsed.category ?? null);
    if (parsed.category) setSelectedServiceType(categoryToServiceType(parsed.category));
  }, [searchParams]);

  async function searchCaregivers() {
    if (!hasValidZip) {
      setError("Please enter a valid 5-digit ZIP code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const urlParams: Record<string, string | number | undefined> = {
        [SEARCH_KEYS.ZIP]: zip.trim() || undefined,
        [SEARCH_KEYS.RADIUS]: radius,
      };
      if (selectedSpecies) urlParams.species = selectedSpecies;
      if (category) {
        urlParams[SEARCH_KEYS.CATEGORY] = category;
      } else if (selectedServiceType) {
        urlParams.serviceType = selectedServiceType;
      }

      const browseUrl = buildSearchUrl("/care/browse", urlParams);
      router.replace(browseUrl, { scroll: false });

      const apiUrl = buildSearchUrl("/api/care/caregivers", urlParams);
      const data = await apiGet<CaregiversBrowseResponse>(apiUrl);
      setCaregivers(data.caregivers ?? []);
      setCapabilities(data.capabilities ?? []);
      setSearchEcho(data.search ?? null);
      
      // Log search event for analytics
      logCareSearch({
        zip: zip.trim(),
        radius,
        category: category ?? undefined,
        resultCount: data.caregivers?.length ?? 0,
      });
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to search"));
      setCaregivers([]);
      setCapabilities([]);
      setSearchEcho(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLocationSelect(newZip: string, newRadius?: number) {
    setZip(newZip);
    if (newRadius != null) setRadius(newRadius);
    setError(null);
    setTimeout(() => {
      if (/^\d{5}$/.test(newZip.trim())) searchCaregivers();
    }, 100);
  }

  async function searchHelpExchange() {
    if (!hasValidZip) {
      setError("Please enter a valid 5-digit ZIP code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await listHelpExchangePostings({
        zip: zip.trim(),
        radius,
      });
      
      let filtered = data.postings;
      if (helpExchangeCategory) {
        filtered = filtered.filter((p) => p.category === helpExchangeCategory);
      }
      
      setHelpExchangePostings(filtered);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to search"));
      setHelpExchangePostings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasValidZip) return;
    if (view === "caregivers") {
      searchCaregivers();
    } else {
      searchHelpExchange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecies, selectedServiceType, category, zip, view, helpExchangeCategory]);

  function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="space-y-8">
      {/* Toggle between Care Helpers and Help Exchange Jobs */}
      <div className="flex gap-2 border-b border-brand/10">
        <button
          onClick={() => {
            setView("caregivers");
            setHelpExchangeCategory("");
          }}
          className={`px-4 py-2 font-medium transition ${
            view === "caregivers"
              ? "border-b-2 border-brand-accent text-brand-accent"
              : "text-brand/60 hover:text-brand"
          }`}
        >
          Care Helpers
        </button>
        <button
          onClick={() => {
            setView("help-exchange");
            setCategory(null);
            setSelectedSpecies("");
            setSelectedServiceType("");
          }}
          className={`px-4 py-2 font-medium transition ${
            view === "help-exchange"
              ? "border-b-2 border-brand-accent text-brand-accent"
              : "text-brand/60 hover:text-brand"
          }`}
        >
          Help Exchange Jobs
        </button>
      </div>

      {/* Search and filters */}
      <div className="rounded-xl border border-brand/10 bg-white p-5 shadow-farmhouse sm:p-6">
        <h2 className="font-display text-xl font-semibold text-brand leading-tight">
          {view === "caregivers" ? "Find helpers near you" : "Find help exchange jobs"}
        </h2>
        <p className="mt-1.5 text-sm text-brand/80 leading-relaxed">
          {view === "caregivers"
            ? "Enter your ZIP and radius, then filter by species or service type."
            : "Enter your ZIP and radius to find help exchange jobs near you."}
        </p>
        <div className="mt-5">
          <LocationInput
            zip={zip}
            radius={radius}
            onZipChange={setZip}
            onRadiusChange={setRadius}
            onSelect={handleLocationSelect}
            submitLabel="Search helpers"
          />
        </div>

        {view === "caregivers" ? (
          <div className="mt-5 pt-5 border-t border-brand/10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="species-filter" className="block text-sm font-medium text-brand mb-1.5">
                Species
              </label>
              <select
                id="species-filter"
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value as AnimalSpecies | "")}
                className="h-10 w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
              >
                <option value="">All species</option>
                {Object.entries(SPECIES_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="service-filter" className="block text-sm font-medium text-brand mb-1.5">
                Service type
              </label>
              <select
                id="service-filter"
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value as CareServiceType | "")}
                className="h-10 w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
              >
                <option value="">All services</option>
                {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="mt-5 pt-5 border-t border-brand/10">
            <label htmlFor="help-exchange-category-filter" className="block text-sm font-medium text-brand mb-1.5">
              Category
            </label>
            <select
              id="help-exchange-category-filter"
              value={helpExchangeCategory}
              onChange={(e) => setHelpExchangeCategory(e.target.value as HelpExchangeCategory | "")}
              className="h-10 w-full max-w-xs rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            >
              <option value="">All categories</option>
              {HELP_EXCHANGE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <InlineAlert variant="error">{error}</InlineAlert>
      )}

      {!hasValidZip && (
        <EmptyState
          title="Enter a ZIP code to find helpers"
          body="Use the search above to enter your ZIP and distance, then search."
          className="mt-4"
        />
      )}

      {hasValidZip && loading && (
        <LoadingSkeleton rows={4} className="mt-4" />
      )}

      {hasValidZip && !loading && view === "caregivers" && caregivers.length === 0 && (
        <EmptyState
          title="No helpers found"
          body="Try expanding your search radius or adjusting filters."
          className="mt-4"
        />
      )}

      {hasValidZip && !loading && view === "help-exchange" && helpExchangePostings.length === 0 && (
        <EmptyState
          title="No jobs found"
          body="Try expanding your search radius or adjusting filters."
          className="mt-4"
        />
      )}

      {hasValidZip && !loading && view === "caregivers" && caregivers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-brand/80 leading-relaxed">
              Within {searchEcho?.radius ?? radius} miles of {searchEcho?.zip ?? zip.trim()}
              {searchEcho?.category ? ` for ${getCategoryLabel(searchEcho.category as CareCategory)}` : category ? ` for ${getCategoryLabel(category)}` : ""}
            </p>
            {(searchEcho?.category || category) && (
              <button
                onClick={() => {
                  const url = buildSearchUrl("/care/browse", {
                    [SEARCH_KEYS.ZIP]: zip.trim() || undefined,
                    [SEARCH_KEYS.RADIUS]: radius,
                  });
                  router.replace(url, { scroll: false });
                }}
                className="text-xs text-brand/60 hover:text-brand underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 rounded"
              >
                Clear filters
              </button>
            )}
          </div>
          <p className="text-sm text-brand/80 leading-relaxed">
            Found {caregivers.length} helper{caregivers.length !== 1 ? "s" : ""}
          </p>
          {/* Only show Includes when we have both results and capability tags (do not relax). */}
          {caregivers.length > 0 && capabilities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-brand/70">Includes:</span>
              {capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand/80"
                >
                  {capabilityLabel(cap)}
                </span>
              ))}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {caregivers.map((caregiver) => (
              <Link
                key={caregiver.id}
                href={`/care/caregiver/${caregiver.id}`}
                className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse transition hover:border-brand-accent/30 hover:shadow-farmhouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                <h3 className="font-display text-lg font-semibold text-brand leading-tight">
                  {caregiver.name || "Helper"}
                </h3>
                {caregiver.distance !== null && (
                  <p className="mt-1 text-sm text-brand/80">
                    {caregiver.distance.toFixed(1)} miles away
                  </p>
                )}
                {caregiver.caregiverProfile?.yearsExperience && (
                  <p className="mt-1 text-sm text-brand/80">
                    {caregiver.caregiverProfile.yearsExperience} years experience
                  </p>
                )}
                {caregiver.listings.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-brand/70 uppercase tracking-wide">Services</p>
                    {caregiver.listings.slice(0, 2).map((listing) => (
                      <div key={listing.id} className="mt-2">
                        <p className="text-sm font-medium text-brand">
                          {listing.title}
                        </p>
                        <p className="text-xs text-brand/80">
                          {formatPrice(listing.rateCents)} {listing.rateUnit}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {caregiver.caregiverProfile?.speciesComfort && caregiver.caregiverProfile.speciesComfort.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {caregiver.caregiverProfile.speciesComfort.slice(0, 3).map((species) => (
                      <span
                        key={species}
                        className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800"
                      >
                        {SPECIES_LABELS[species] ?? species}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasValidZip && !loading && view === "help-exchange" && helpExchangePostings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-brand/80 leading-relaxed">
              Within {radius} miles of {zip.trim()}
              {helpExchangeCategory ? ` for ${HELP_EXCHANGE_CATEGORIES.find((c) => c.value === helpExchangeCategory)?.label}` : ""}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {helpExchangePostings.map((posting) => (
              <HelpExchangePostingCard key={posting.id} posting={posting} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HelpExchangePostingCard({ posting }: { posting: HelpExchangePosting }) {
  const [contacting, setContacting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const router = useRouter();

  async function handleContact() {
    setContacting(true);
    try {
      const response = await apiPost<{ conversationId: string }>("/api/dashboard/conversations/create", {
        userId: posting.createdById,
      });
      router.push(`/dashboard/messages?conversationId=${response.conversationId}`);
    } catch (err) {
      console.error("Failed to create conversation:", err);
      alert(err instanceof ApiError ? apiErrorMessage(err) : "Failed to contact poster");
    } finally {
      setContacting(false);
    }
  }

  async function handleApply() {
    setApplying(true);
    try {
      await apiPost<{ bid: { id: string } }>(`/api/help-exchange/postings/${posting.id}/bids`, { message: "" });
      setApplied(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "UNAUTHORIZED") {
        router.push("/auth/login");
        return;
      }
      alert(err instanceof ApiError ? apiErrorMessage(err) : "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
      <div className="mb-2">
        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-brand-light text-brand">
          {posting.category.replace(/_/g, " ")}
        </span>
      </div>
      <h3 className="font-display text-lg font-semibold text-brand mb-2">{posting.title}</h3>
      <p className="text-sm text-brand/80 mb-4 line-clamp-3">{posting.description}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-brand/60">
          {posting.createdBy.name || "Anonymous"} • {posting.zipCode}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            disabled={applying || applied}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applied ? "Applied" : applying ? "Applying…" : "Apply"}
          </button>
          <button
            onClick={handleContact}
            disabled={contacting}
            className="rounded-lg border border-brand/30 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"
          >
            {contacting ? "…" : "Contact"}
          </button>
        </div>
      </div>
    </div>
  );
}
