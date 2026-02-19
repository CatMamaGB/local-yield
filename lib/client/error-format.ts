/**
 * Shared helper: convert unknown thrown value (e.g. ApiError, Error) to { message, requestId? }.
 * Use in auth forms and other UI that need to show API failures without alert() or console.error.
 */

import { ApiError } from "./api-client";

export interface FormattedError {
  message: string;
  requestId?: string;
}

export function formatApiError(err: unknown): FormattedError {
  if (err instanceof ApiError) {
    return { message: err.message, requestId: err.requestId };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: "Something went wrong" };
}
