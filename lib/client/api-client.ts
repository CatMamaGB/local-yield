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

type ApiErrorShape = string | { code: string; message: string };

type ApiJson =
  | { ok: true; data: unknown }
  | { ok: false; error: ApiErrorShape; code?: string; requestId?: string };

function isApiJson(value: unknown): value is ApiJson {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as ApiJson).ok === "boolean"
  );
}

function isStructuredError(error: ApiErrorShape): error is { code: string; message: string } {
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
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
  const isStructured = isStructuredError(error);
  const message = isStructured ? error.message : typeof error === "string" ? error : "Something went wrong";
  const errorCode = isStructured ? error.code : code;
  const isRateLimit =
    res.status === 429 || errorCode === "RATE_LIMIT" || errorCode === "MESSAGES_RATE_LIMIT";
  const friendlyMessage = isRateLimit
    ? "Too many requests. Please wait a moment and try again."
    : message;

  throw new ApiError(friendlyMessage, {
    code: errorCode ?? (isRateLimit ? "RATE_LIMIT" : undefined),
    status: res.status,
    requestId,
  });
}

const defaultHeaders: Record<string, string> = {
  Accept: "application/json",
};

/**
 * Get auth token from storage (localStorage for web).
 * Returns token string or null.
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("api_token");
  } catch {
    return null;
  }
}

/**
 * Set auth token in storage.
 */
export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem("api_token", token);
    } else {
      localStorage.removeItem("api_token");
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get headers with auth token if available.
 */
function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders(body?: unknown): Record<string, string> {
  const h = { ...defaultHeaders, ...getAuthHeaders() };
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
    headers: { ...defaultHeaders, ...getAuthHeaders(), ...init?.headers },
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
    headers: { ...defaultHeaders, ...getAuthHeaders(), ...init?.headers },
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
