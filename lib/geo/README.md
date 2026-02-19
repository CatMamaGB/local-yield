# Geo Strategy

## Decision: ZIP-only approach

We store and use ZIP codes only (no lat/lng in database). This simplifies the data model and is sufficient for our current use case.

## Distance Calculation

- Uses `zipcodes` package (US ZIPs only)
- Haversine formula for distance between coordinates
- Server-side only (API routes)

## Filtering Strategy

- **Current**: App-level filtering using `filterByZipAndRadius()`
- **Future**: Consider DB-level filtering if performance requires it (PostGIS, etc.)

## Radius Options

Standardized radius options: `[5, 10, 25, 50]` miles (see `constants.ts`).
- Keep 100 out until performance confidence
- Used in UI dropdowns, param parsing validators, API validation

## Future Considerations

If lat/lng storage is needed:
- Add `latitude` and `longitude` fields to User/Product models
- Use geocoding service to populate on ZIP entry
- Consider PostGIS for efficient radius queries
