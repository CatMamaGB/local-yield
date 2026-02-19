"use client";

/**
 * Admin reports queue: list + detail with assign, resolve, evidence viewer.
 */

import { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  entityType: string;
  entityId: string;
  status: string;
  problemType?: string | null;
  proposedOutcome?: string | null;
  resolutionOutcome?: string | null;
  resolutionNote?: string | null;
  resolutionAmountCents?: number | null;
  createdAt: string;
  reporter: { id: string; name: string | null; email: string };
  reviewer: { id: string; name: string | null } | null;
  assignedTo?: { id: string; name: string | null } | null;
  attachments?: { id: string; url: string; mimeType: string }[];
}

const RESOLUTION_OUTCOMES = [
  "REFUND", "PARTIAL_REFUND", "STORE_CREDIT", "RESOLVED_NO_REFUND", "DISMISSED",
] as const;

export function ReportsClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Report | null>(null);
  const [resolveForm, setResolveForm] = useState({
    resolutionOutcome: "",
    resolutionNote: "",
    resolutionAmountCents: "",
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, entityTypeFilter]);

  async function fetchReports() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (entityTypeFilter) params.set("entityType", entityTypeFilter);
      const data = await apiGet<{ reports: Report[] }>(`/api/reports?${params}`);
      setReports(data.reports ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to load reports"));
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: string) {
    setDetailId(id);
    setDetail(null);
    setResolveForm({ resolutionOutcome: "", resolutionNote: "", resolutionAmountCents: "" });
    try {
      const data = await apiGet<{ report: Report }>(`/api/reports/${id}`);
      setDetail(data.report);
    } catch {
      setError("Failed to load report detail");
    }
  }

  async function handleAssignToMe(reportId: string) {
    setUpdating(true);
    setError(null);
    try {
      await apiPatch(`/api/admin/reports/${reportId}`, { assignedToId: "me" });
      fetchReports();
      if (detailId === reportId) {
        const data = await apiGet<{ report: Report }>(`/api/reports/${reportId}`);
        setDetail(data.report);
      }
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to assign"));
    } finally {
      setUpdating(false);
    }
  }

  async function handleResolve(reportId: string) {
    const outcome = resolveForm.resolutionOutcome || undefined;
    if (!outcome) {
      setError("Select a resolution outcome");
      return;
    }
    if (outcome === "STORE_CREDIT") {
      const cents = parseInt(resolveForm.resolutionAmountCents, 10);
      if (!Number.isInteger(cents) || cents <= 0) {
        setError("Enter a positive amount (cents) for store credit");
        return;
      }
    }
    setUpdating(true);
    setError(null);
    try {
      await apiPatch(`/api/admin/reports/${reportId}`, {
        status: "RESOLVED",
        resolutionOutcome: outcome,
        resolutionNote: resolveForm.resolutionNote.trim() || undefined,
        resolutionAmountCents: outcome === "STORE_CREDIT" ? parseInt(resolveForm.resolutionAmountCents, 10) : undefined,
      });
      setDetailId(null);
      setDetail(null);
      fetchReports();
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to resolve"));
    } finally {
      setUpdating(false);
    }
  }

  async function handleStatusUpdate(reportId: string, status: string) {
    try {
      await apiPost(`/api/admin/reports/${reportId}/status`, { status });
      fetchReports();
      if (detailId === reportId) setDetailId(null);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to update"));
    }
  }

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="status-filter" className="text-sm font-medium text-brand">Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-brand/20 px-3 py-2 text-brand"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
        <label htmlFor="entity-filter" className="text-sm font-medium text-brand">Entity:</label>
        <select
          id="entity-filter"
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="rounded-lg border border-brand/20 px-3 py-2 text-brand"
        >
          <option value="">All</option>
          <option value="order">Order</option>
          <option value="caregiver">Caregiver</option>
          <option value="help_exchange_posting">Help posting</option>
        </select>
      </div>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {reports.length === 0 ? (
        <p className="text-brand/80">No reports found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand/10 bg-brand-light/40">
                <th className="py-3 pl-4 text-left font-display font-semibold text-brand">Entity</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Reason / Problem</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Reporter</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Assigned</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Status</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Date</th>
                <th className="py-3 pr-4 text-left font-display font-semibold text-brand">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-brand/10">
                  <td className="py-3 pl-4">
                    <div className="text-sm font-medium text-brand">{report.entityType}</div>
                    <div className="text-xs text-brand/60">{report.entityId.slice(-8)}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand">{report.reason}</div>
                    {report.entityType === "order" && report.problemType && (
                      <div className="text-xs text-brand/70">{report.problemType} → {report.proposedOutcome ?? ""}</div>
                    )}
                  </td>
                  <td className="py-3 text-sm text-brand">{report.reporter.name || report.reporter.email}</td>
                  <td className="py-3 text-sm text-brand/80">{report.assignedTo?.name ?? "—"}</td>
                  <td className="py-3">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-brand-light text-brand">
                      {report.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-brand/80">{new Date(report.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openDetail(report.id)}
                        className="text-xs text-brand-accent hover:underline"
                      >
                        View
                      </button>
                      {report.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAssignToMe(report.id)}
                            disabled={updating}
                            className="text-xs text-brand/70 hover:underline disabled:opacity-50"
                          >
                            Assign to me
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(report.id, "DISMISSED")}
                            className="text-xs text-brand/60 hover:underline"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailId && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
            <h3 className="font-display text-lg font-semibold text-brand">Report detail</h3>
            <p className="mt-1 text-sm text-brand/70">ID: {detail.id}</p>
            <p className="mt-2 text-sm text-brand"><strong>Reporter:</strong> {detail.reporter.name || detail.reporter.email}</p>
            <p className="text-sm text-brand"><strong>Entity:</strong> {detail.entityType} — {detail.entityId}</p>
            {detail.entityType === "order" && (
              <>
                <p className="text-sm text-brand"><strong>Problem:</strong> {detail.problemType ?? "—"}</p>
                <p className="text-sm text-brand"><strong>Proposed outcome:</strong> {detail.proposedOutcome ?? "—"}</p>
              </>
            )}
            {detail.description && <p className="mt-2 text-sm text-brand/80">{detail.description}</p>}
            {detail.attachments && detail.attachments.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-brand">Evidence</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {detail.attachments.map((a) => (
                    <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-accent hover:underline">
                      View image
                    </a>
                  ))}
                </div>
              </div>
            )}
            {detail.status !== "RESOLVED" && detail.status !== "DISMISSED" && (
              <div className="mt-6 space-y-3 border-t border-brand/10 pt-4">
                <p className="text-sm font-medium text-brand">Resolve</p>
                <select
                  value={resolveForm.resolutionOutcome}
                  onChange={(e) => setResolveForm((f) => ({ ...f, resolutionOutcome: e.target.value }))}
                  className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand"
                >
                  <option value="">Select outcome</option>
                  {RESOLUTION_OUTCOMES.map((o) => (
                    <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
                  ))}
                </select>
                {resolveForm.resolutionOutcome === "STORE_CREDIT" && (
                  <input
                    type="number"
                    min="1"
                    placeholder="Amount (cents)"
                    value={resolveForm.resolutionAmountCents}
                    onChange={(e) => setResolveForm((f) => ({ ...f, resolutionAmountCents: e.target.value }))}
                    className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand"
                  />
                )}
                <textarea
                  placeholder="Resolution note (optional)"
                  value={resolveForm.resolutionNote}
                  onChange={(e) => setResolveForm((f) => ({ ...f, resolutionNote: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolve(detail.id)}
                    disabled={updating}
                    className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent/90 disabled:opacity-50"
                  >
                    {updating ? "Saving…" : "Resolve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignToMe(detail.id)}
                    disabled={updating}
                    className="rounded-lg border border-brand/20 px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
                  >
                    Assign to me
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDetailId(null); setDetail(null); }}
                    className="rounded-lg border border-brand/20 px-4 py-2 text-sm font-medium text-brand"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            {(detail.status === "RESOLVED" || detail.status === "DISMISSED") && (
              <div className="mt-4 border-t border-brand/10 pt-4">
                <p className="text-sm text-brand/80">
                  {detail.resolutionOutcome && `Outcome: ${detail.resolutionOutcome.replace(/_/g, " ")}`}
                  {detail.resolutionNote && ` — ${detail.resolutionNote}`}
                  {detail.resolutionAmountCents != null && detail.resolutionAmountCents > 0 && ` ($${(detail.resolutionAmountCents / 100).toFixed(2)} credit)`}
                </p>
                <button
                  type="button"
                  onClick={() => { setDetailId(null); setDetail(null); }}
                  className="mt-3 rounded-lg border border-brand/20 px-4 py-2 text-sm font-medium text-brand"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
