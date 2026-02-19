/**
 * Centralized telemetry logging.
 * Only logs in dev unless TELEMETRY_ENABLED=true.
 * All events are sanitized to prevent PII leakage.
 */

import type { TelemetryEvent } from "./events";
import { sanitizeTelemetryEvent } from "./sanitize";

/**
 * Log a telemetry event. Events are sanitized before logging.
 * Only logs in dev unless TELEMETRY_ENABLED=true.
 */
export function logTelemetry(event: TelemetryEvent): void {
  // Only log in dev unless explicitly enabled
  if (process.env.TELEMETRY_ENABLED !== "true" && process.env.NODE_ENV === "production") {
    return;
  }

  const sanitized = sanitizeTelemetryEvent(event);

  // Dev: console.info
  if (process.env.NODE_ENV !== "production") {
    console.info("[telemetry]", JSON.stringify(sanitized));
  }

  // TODO: When ready, integrate with analytics service:
  // - PostHog: posthog.capture(event.event, sanitized)
  // - Mixpanel: mixpanel.track(event.event, sanitized)
  // - Custom: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(sanitized) })
  // - DB logging: await logTelemetryToDb(sanitized)
}
