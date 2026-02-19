/**
 * Telemetry for care search events.
 * Convenience wrapper around centralized telemetry module.
 */

import { logTelemetry } from "@/lib/telemetry/telemetry";
import type { CareSearchSubmittedEvent } from "@/lib/telemetry/events";

/**
 * Log a care search event. zipPrefix is extracted from full ZIP (first 3 digits).
 */
export function logCareSearch(
  event: Omit<CareSearchSubmittedEvent, "zipPrefix" | "event"> & { zip: string }
): void {
  const zipPrefix = event.zip.slice(0, 3);
  const telemetryEvent: CareSearchSubmittedEvent = {
    event: "care_search_submitted",
    zipPrefix,
    radius: event.radius,
    category: event.category,
    resultCount: event.resultCount,
  };

  logTelemetry(telemetryEvent);
}
