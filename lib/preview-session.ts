/**
 * Preview session: sign/verify HTTP-only cookie and hash IP for audit log.
 * Uses PREVIEW_COOKIE_SECRET; never store raw IP.
 */

import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PAYLOAD_SEP = ".";

export interface PreviewSessionPayload {
  viewerId: string;
  issuedAt: number;
}

/**
 * Sign a preview session payload for cookie value.
 * Format: base64(payload).base64(hmac).
 */
export function signPreviewSession(
  payload: PreviewSessionPayload,
  secret: string
): string {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson, "utf8").toString("base64url");
  const hmac = createHmac("sha256", secret);
  hmac.update(payloadB64);
  const sig = hmac.digest("base64url");
  return `${payloadB64}${PAYLOAD_SEP}${sig}`;
}

/**
 * Verify cookie value and return payload or null (invalid/expired).
 * Rejects if issuedAt is older than 30 days.
 */
export function verifyPreviewSession(
  cookieValue: string | undefined | null,
  secret: string
): PreviewSessionPayload | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const idx = cookieValue.lastIndexOf(PAYLOAD_SEP);
  if (idx === -1) return null;
  const payloadB64 = cookieValue.slice(0, idx);
  const sigB64 = cookieValue.slice(idx + 1);
  const hmac = createHmac("sha256", secret);
  hmac.update(payloadB64);
  const expectedSig = hmac.digest("base64url");
  if (expectedSig.length !== sigB64.length || !timingSafeEqual(Buffer.from(expectedSig, "utf8"), Buffer.from(sigB64, "utf8"))) {
    return null;
  }
  let payload: PreviewSessionPayload;
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    payload = JSON.parse(json) as PreviewSessionPayload;
  } catch {
    return null;
  }
  if (!payload.viewerId || typeof payload.issuedAt !== "number") return null;
  if (Date.now() - payload.issuedAt > COOKIE_MAX_AGE_MS) return null;
  return payload;
}

/**
 * Hash IP with secret for audit log; never store raw IP.
 * Returns short hex string.
 */
export function hashIp(ip: string | undefined | null, secret: string): string {
  const raw = ip ?? "";
  const hmac = createHmac("sha256", secret);
  hmac.update(raw);
  return hmac.digest("hex").slice(0, 32);
}
