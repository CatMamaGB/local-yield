/**
 * PII detection patterns for messaging safety.
 * Blocks common patterns that indicate PII sharing.
 */

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
const PHONE_PATTERN = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/;
const CREDIT_CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;

export interface PIIMatch {
  type: "email" | "phone" | "ssn" | "credit_card";
  pattern: RegExp;
}

const PII_PATTERNS: PIIMatch[] = [
  { type: "email", pattern: EMAIL_PATTERN },
  { type: "phone", pattern: PHONE_PATTERN },
  { type: "ssn", pattern: SSN_PATTERN },
  { type: "credit_card", pattern: CREDIT_CARD_PATTERN },
];

/**
 * Check if message body contains PII patterns.
 * Returns the first match found, or null if no PII detected.
 */
export function detectPII(messageBody: string): PIIMatch | null {
  const normalized = messageBody.trim();
  for (const pii of PII_PATTERNS) {
    if (pii.pattern.test(normalized)) {
      return pii;
    }
  }
  return null;
}
