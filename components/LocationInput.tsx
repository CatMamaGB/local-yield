"use client";

/**
 * ZIP code + radius input for location-filtered browsing.
 * Layout: ZIP full width in column; reserved height for error so it doesn't shift other controls.
 */

import { useState } from "react";
import { isValidZip } from "@/lib/utils";

export interface LocationInputProps {
  defaultZip?: string;
  defaultRadius?: number;
  onSelect?: (zip: string, radiusMiles?: number) => void;
  /** Submit button label (e.g. "Search caregivers" for Care, "Update location" for Market). */
  submitLabel?: string;
}

export function LocationInput({
  defaultZip = "",
  defaultRadius = 10,
  onSelect,
  submitLabel = "Update location",
}: LocationInputProps) {
  const [zip, setZip] = useState(defaultZip);
  const [radius, setRadius] = useState(defaultRadius);
  const [zipError, setZipError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = zip.trim();
    if (!isValidZip(trimmed)) {
      setZipError("Enter a valid 5-digit ZIP (e.g. 12345)");
      return;
    }
    setZipError(null);
    onSelect?.(trimmed, radius);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4 md:items-end">
      <div className="md:col-span-5">
        <label htmlFor="zip" className="block text-sm font-medium text-brand mb-1.5">
          Your ZIP code
        </label>
        <input
          id="zip"
          type="text"
          value={zip}
          onChange={(e) => {
            setZip(e.target.value);
            if (zipError) setZipError(null);
          }}
          placeholder="12345"
          maxLength={10}
          className="h-10 w-full rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        />
        <p className="mt-1 min-h-[16px] text-xs text-red-600">
          {zipError ?? ""}
        </p>
      </div>

      <div className="md:col-span-3">
        <label htmlFor="radius" className="block text-sm font-medium text-brand mb-1.5">
          Radius (miles)
        </label>
        <select
          id="radius"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="h-10 w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        >
          {[5, 10, 25, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-4 flex justify-end md:justify-end">
        <button
          type="submit"
          className="h-10 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
