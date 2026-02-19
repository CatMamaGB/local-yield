/**
 * Distance calculation utilities using ZIP codes.
 * Uses zipcodes package (US ZIPs). Run server-side only (API routes).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const zipcodes = require("zipcodes") as {
  lookup: (zip: string | number) => { latitude: number; longitude: number } | undefined;
  distance: (zipA: string | number, zipB: string | number) => number | null;
};

import { normalizeZip } from "./zip";

/** Get coordinates for a US ZIP, or null if not found. */
export function getZipCoordinates(zip: string): { lat: number; lng: number } | null {
  const normalized = normalizeZip(zip);
  if (!normalized) return null;
  const loc = zipcodes.lookup(normalized);
  if (!loc?.latitude || !loc?.longitude) return null;
  return { lat: loc.latitude, lng: loc.longitude };
}

/** Haversine distance in miles between two points. */
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.76; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Distance in miles between two ZIPs. Returns null if either ZIP is unknown. */
export function getDistanceBetweenZips(zipA: string, zipB: string): number | null {
  const na = normalizeZip(zipA);
  const nb = normalizeZip(zipB);
  if (!na || !nb) return null;
  const d = zipcodes.distance(na, nb);
  return d == null ? null : Math.round(d * 10) / 10; // one decimal
}
