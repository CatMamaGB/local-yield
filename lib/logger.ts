/**
 * Minimal error logging for API routes. No vendor lock-in.
 * Use logError(scope, error, meta) in catch blocks; include requestId in meta for tracing.
 */

export function logError(
  scope: string,
  error: unknown,
  meta?: Record<string, string | number | boolean | null>
): void {
  const message = error instanceof Error ? error.message : String(error);
  const payload = {
    scope,
    message,
    ...(meta && Object.keys(meta).length > 0 ? meta : {}),
  };
  console.error("[error]", JSON.stringify(payload));
}
