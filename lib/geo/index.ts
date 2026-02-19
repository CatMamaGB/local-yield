/**
 * Geo utilities: ZIP validation, distance calculations, and radius filtering.
 * 
 * Strategy: ZIP-only approach (no lat/lng storage).
 * - Distance calculation: zipcodes package (Haversine)
 * - Filtering: app-level (filterByZipAndRadius) for now
 * - Future: Consider DB-level filtering if performance requires it
 */

export * from "./constants";
export * from "./zip";
export * from "./distance";
export * from "./filter";
