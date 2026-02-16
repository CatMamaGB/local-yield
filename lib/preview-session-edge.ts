/**
 * Edge-compatible preview session verification (Web Crypto only).
 * Use this in middleware; use lib/preview-session.ts in API routes and server code.
 */

const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PAYLOAD_SEP = ".";

export interface PreviewSessionPayload {
  viewerId: string;
  issuedAt: number;
}

/**
 * Verify cookie value using Web Crypto (HMAC-SHA256). Returns payload or null.
 */
export async function verifyPreviewSessionEdge(
  cookieValue: string | undefined | null,
  secret: string
): Promise<PreviewSessionPayload | null> {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const idx = cookieValue.lastIndexOf(PAYLOAD_SEP);
  if (idx === -1) return null;
  const payloadB64 = cookieValue.slice(0, idx);
  const sigB64 = cookieValue.slice(idx + 1);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  if (expectedSig.length !== sigB64.length) return null;
  const a = new Uint8Array(new TextEncoder().encode(expectedSig));
  const b = new Uint8Array(new TextEncoder().encode(sigB64));
  if (a.length !== b.length) return null;
  let eq = true;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) eq = false;
  if (!eq) return null;

  let payload: PreviewSessionPayload;
  try {
    const bin = Uint8Array.from(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0)
    );
    const json = new TextDecoder().decode(bin);
    payload = JSON.parse(json) as PreviewSessionPayload;
  } catch {
    return null;
  }
  if (!payload.viewerId || typeof payload.issuedAt !== "number") return null;
  if (Date.now() - payload.issuedAt > COOKIE_MAX_AGE_MS) return null;
  return payload;
}
