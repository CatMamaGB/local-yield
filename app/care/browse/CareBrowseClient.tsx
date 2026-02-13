"use client";

/**
 * Client component for browsing caregivers with ZIP search and filters.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { LocationInput } from "@/components/LocationInput";
import type { AnimalSpecies, CareServiceType } from "@prisma/client";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface CaregiverSummary {
  id: string;
  name: string | null;
  zipCode: string;
  distance: number | null;
  caregiverProfile: {
    bio: string | null;
    yearsExperience: number | null;
    experienceBackground: string[];
    speciesComfort: AnimalSpecies[];
    tasksComfort: string[];
  } | null;
  listings: Array<{
    id: string;
    title: string;
    serviceType: CareServiceType;
    speciesSupported: AnimalSpecies[];
    rateCents: number;
    rateUnit: string;
  }>;
}

// UI labels (i18n-friendly structure)
const LABELS = {
  species: {
    HORSES: "Horses",
    CATTLE: "Cattle",
    GOATS: "Goats",
    SHEEP: "Sheep",
    PIGS: "Pigs",
    POULTRY: "Poultry",
    ALPACAS: "Alpacas",
    LLAMAS: "Llamas",
    DONKEYS: "Donkeys",
    OTHER: "Other",
  },
  serviceType: {
    DROP_IN: "Drop-in visits",
    OVERNIGHT: "Overnight care",
    BOARDING: "Boarding",
    FARM_SITTING: "Farm sitting",
  },
} as const;

export function CareBrowseClient() {
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(25);
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalSpecies | "">("");
  const [selectedServiceType, setSelectedServiceType] = useState<CareServiceType | "">("");
  const [caregivers, setCaregivers] = useState<CaregiverSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchCaregivers() {
    if (!zip || zip.trim().length !== 5) {
      setError("Please enter a valid 5-digit ZIP code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        zip: zip.trim(),
        radius: radius.toString(),
      });
      if (selectedSpecies) params.append("species", selectedSpecies);
      if (selectedServiceType) params.append("serviceType", selectedServiceType);

      const data = await apiGet<{ caregivers?: CaregiverSummary[] }>(`/api/care/caregivers?${params}`);
      setCaregivers(data.caregivers ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to search"));
      setCaregivers([]);
    } finally {
      setLoading(false);
    }
  }

  function handleLocationSelect(newZip: string, newRadius?: number) {
    setZip(newZip);
    if (newRadius) setRadius(newRadius);
    // Auto-search when location is set
    setTimeout(() => {
      searchCaregivers();
    }, 100);
  }

  useEffect(() => {
    // Auto-search when filters change (if ZIP is set)
    if (zip && zip.trim().length === 5) {
      searchCaregivers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecies, selectedServiceType]);

  function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="space-y-8">
      {/* Search and filters */}
      <div className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
        <h2 className="font-display text-xl font-semibold text-brand leading-tight mb-4">
          Find caregivers near you
        </h2>
        <LocationInput
          defaultZip={zip}
          defaultRadius={radius}
          onSelect={handleLocationSelect}
          submitLabel="Search caregivers"
        />

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="species-filter" className="block text-sm font-medium text-brand mb-1.5">
              Species
            </label>
            <select
              id="species-filter"
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value as AnimalSpecies | "")}
              className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            >
              <option value="">All species</option>
              {Object.entries(LABELS.species).map(([key, label]) => (
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
              className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            >
              <option value="">All services</option>
              {Object.entries(LABELS.serviceType).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <InlineAlert variant="error">{error}</InlineAlert>
      )}

      {loading && (
        <LoadingSkeleton rows={4} className="mt-4" />
      )}

      {!loading && caregivers.length === 0 && zip && (
        <EmptyState
          title="No caregivers found"
          body="Try expanding your search radius or adjusting filters."
          className="mt-4"
        />
      )}

      {!loading && caregivers.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-brand/80 leading-relaxed">
            Found {caregivers.length} caregiver{caregivers.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {caregivers.map((caregiver) => (
              <Link
                key={caregiver.id}
                href={`/care/caregiver/${caregiver.id}`}
                className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse transition hover:border-brand-accent/30 hover:shadow-farmhouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                <h3 className="font-display text-lg font-semibold text-brand leading-tight">
                  {caregiver.name || "Caregiver"}
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
                        {LABELS.species[species] || species}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
