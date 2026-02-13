/**
 * Frontend API client for /api routes.
 * Enforces contract: Success { ok: true, data }; Error { ok: false, error, code?, requestId? }.
 * On success returns data; on error throws ApiError (message, code, status, requestId).
 */

export class ApiError extends Error {
  code?: string;
  status?: number;
  requestId?: string;

  constructor(
    message: string,
    opts?: { code?: string; status?: number; requestId?: string }
  ) {
    super(message);
    this.name = "ApiError";
    this.code = opts?.code;
    this.status = opts?.status;
    this.requestId = opts?.requestId;
  }
}

type ApiJson =
  | { ok: true; data: unknown }
  | { ok: false; error: string; code?: string; requestId?: string };

function isApiJson(value: unknown): value is ApiJson {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as ApiJson).ok === "boolean"
  );
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError("Invalid response from server", { status: res.status });
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("Invalid response from server", { status: res.status });
  }

  if (!isApiJson(json)) {
    throw new ApiError("Invalid response from server", { status: res.status });
  }

  if (json.ok === true) {
    return json.data as T;
  }

  const { error, code, requestId } = json;
  const message = typeof error === "string" ? error : "Something went wrong";
  const isRateLimit =
    res.status === 429 || code === "RATE_LIMIT" || code === "MESSAGES_RATE_LIMIT";
  const friendlyMessage = isRateLimit
    ? "Too many requests. Please wait a moment and try again."
    : message;

  throw new ApiError(friendlyMessage, {
    code: code ?? (isRateLimit ? "RATE_LIMIT" : undefined),
    status: res.status,
    requestId,
  });
}

const defaultHeaders: Record<string, string> = {
  Accept: "application/json",
};

function jsonHeaders(body?: unknown): Record<string, string> {
  const h = { ...defaultHeaders };
  if (body !== undefined) {
    h["Content-Type"] = "application/json";
  }
  return h;
}

/**
 * GET request. Returns json.data on success; throws ApiError on failure.
 */
export async function apiGet<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    method: "GET",
    headers: { ...defaultHeaders, ...init?.headers },
  });
  return parseResponse<T>(res);
}

/**
 * POST request. Sends body as JSON. Returns json.data on success; throws ApiError on failure.
 */
export async function apiPost<T>(
  url: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    method: "POST",
    headers: { ...jsonHeaders(body), ...init?.headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(res);
}

/**
 * PATCH request. Sends body as JSON. Returns json.data on success; throws ApiError on failure.
 */
export async function apiPatch<T>(
  url: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    method: "PATCH",
    headers: { ...jsonHeaders(body), ...init?.headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(res);
}

/**
 * DELETE request. Returns json.data on success; throws ApiError on failure.
 */
export async function apiDelete<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    method: "DELETE",
    headers: { ...defaultHeaders, ...init?.headers },
  });
  return parseResponse<T>(res);
}

/**
 * Map ApiError codes to user-friendly messages. Use for INTERNAL_ERROR + requestId.
 */
export function apiErrorMessage(err: ApiError): string {
  if (err.code === "RATE_LIMIT" || err.code === "MESSAGES_RATE_LIMIT") {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (err.requestId && (err.status === 500 || err.code === "INTERNAL_ERROR")) {
    return `Something went wrong. If you contact support, share this ID: ${err.requestId}`;
  }
  return err.message;
}
