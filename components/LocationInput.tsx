"use client";

/**
 * ZIP code input for location-filtered browsing.
 * TODO: Optional radius; wire to radius-based matching.
 */

import { useState } from "react";
import { isValidZip } from "@/lib/utils";

export interface LocationInputProps {
  defaultZip?: string;
  onSelect?: (zip: string, radiusMiles?: number) => void;
}

export function LocationInput({ defaultZip = "", onSelect }: LocationInputProps) {
  const [zip, setZip] = useState(defaultZip);
  const [radius, setRadius] = useState(10);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = zip.trim();
    if (!isValidZip(trimmed)) {
      setError("Enter a valid 5-digit ZIP (e.g. 12345)");
      return;
    }
    setError(null);
    onSelect?.(trimmed, radius);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="zip" className="block text-sm font-medium text-brand">
          Your ZIP code
        </label>
        <input
          id="zip"
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="12345"
          maxLength={10}
          className="mt-1 w-32 rounded border border-brand/30 px-3 py-2 text-brand"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <div>
        <label htmlFor="radius" className="block text-sm font-medium text-brand">
          Radius (miles)
        </label>
        <select
          id="radius"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="mt-1 rounded border border-brand/30 px-3 py-2 text-brand"
        >
          {[5, 10, 25, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded bg-brand px-4 py-2 text-white hover:bg-brand/90"
      >
        Update location
      </button>
    </form>
  );
}
