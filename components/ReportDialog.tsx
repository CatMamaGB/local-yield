"use client";

/**
 * Report dialog: caregivers, help exchange postings, or orders (disputes).
 * For orders: problem type and proposed outcome required; optional evidence URLs (max 3).
 */

import { useState } from "react";
import { apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";

export type ReportReason = "SPAM" | "INAPPROPRIATE_CONTENT" | "SCAM" | "HARASSMENT" | "OTHER";

const PROBLEM_TYPES = [
  { value: "LATE", label: "Late / never arrived" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "MISSING", label: "Missing items" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "WRONG_ITEM", label: "Wrong item" },
  { value: "OTHER", label: "Other" },
] as const;

const PROPOSED_OUTCOMES = [
  { value: "REFUND", label: "Full refund" },
  { value: "PARTIAL_REFUND", label: "Partial refund" },
  { value: "REPLACEMENT", label: "Replacement" },
  { value: "STORE_CREDIT", label: "Store credit" },
  { value: "OTHER", label: "Other" },
] as const;

interface ReportDialogProps {
  entityType: "caregiver" | "help_exchange_posting" | "order";
  entityId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "SPAM", label: "Spam" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
  { value: "SCAM", label: "Scam or fraud" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "OTHER", label: "Other" },
];

export function ReportDialog({ entityType, entityId, onClose, onSuccess }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [problemType, setProblemType] = useState<string>("");
  const [proposedOutcome, setProposedOutcome] = useState<string>("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrder = entityType === "order";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason");
      return;
    }
    if (isOrder && (!problemType || !proposedOutcome)) {
      setError("Please select problem type and proposed outcome");
      return;
    }

    setSubmitting(true);
    setError(null);

    const attachments = isOrder
      ? evidenceUrls
          .filter((u) => u.trim().startsWith("http"))
          .slice(0, 3)
          .map((url) => ({ url: url.trim(), mimeType: "image/jpeg", sizeBytes: 0 }))
      : undefined;

    try {
      await apiPost("/api/reports", {
        reason,
        description: description.trim() || undefined,
        entityType,
        entityId,
        ...(isOrder && { problemType, proposedOutcome, attachments: attachments?.length ? attachments : undefined }),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to submit report"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
        <h2 className="font-display text-xl font-semibold text-brand mb-4">
          Report {entityType === "caregiver" ? "Helper" : entityType === "order" ? "Order / Problem" : "Posting"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-brand mb-1.5">
              Reason *
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
              required
            >
              <option value="">Select a reason</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {isOrder && (
            <>
              <div>
                <label htmlFor="problemType" className="block text-sm font-medium text-brand mb-1.5">
                  Problem type *
                </label>
                <select
                  id="problemType"
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value)}
                  className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                  required={isOrder}
                >
                  <option value="">Select</option>
                  {PROBLEM_TYPES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="proposedOutcome" className="block text-sm font-medium text-brand mb-1.5">
                  Proposed outcome *
                </label>
                <select
                  id="proposedOutcome"
                  value={proposedOutcome}
                  onChange={(e) => setProposedOutcome(e.target.value)}
                  className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                  required={isOrder}
                >
                  <option value="">Select</option>
                  {PROPOSED_OUTCOMES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand mb-1.5">
                  Evidence (image URLs, max 3)
                </label>
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    type="url"
                    placeholder={`Evidence image URL ${i + 1}`}
                    value={evidenceUrls[i] ?? ""}
                    onChange={(e) => {
                      const next = [...evidenceUrls];
                      next[i] = e.target.value;
                      setEvidenceUrls(next);
                    }}
                    className="mb-2 w-full rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                  />
                ))}
              </div>
            </>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-brand mb-1.5">
              Additional details (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional information..."
              rows={4}
              className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            />
          </div>

          {error && <InlineAlert variant="error">{error}</InlineAlert>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand/20 px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
