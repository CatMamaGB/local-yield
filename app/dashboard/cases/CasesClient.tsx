"use client";

/**
 * Fetches and displays "My cases" (mine=1) and "Cases involving my orders" (forMe=1) when producer.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatDate } from "@/lib/utils";

interface ReportRow {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  problemType?: string | null;
  proposedOutcome?: string | null;
  resolutionOutcome?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
}

function ReportStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    REVIEWED: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
    DISMISSED: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100"}`}>
      {status}
    </span>
  );
}

export function CasesClient({ isProducer }: { isProducer: boolean }) {
  const [mine, setMine] = useState<ReportRow[]>([]);
  const [forMe, setForMe] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [mineRes, forMeRes] = await Promise.all([
          apiGet<{ reports: ReportRow[] }>("/api/reports?mine=1&pageSize=50"),
          isProducer ? apiGet<{ reports: ReportRow[] }>("/api/reports?forMe=1&pageSize=50") : { reports: [] },
        ]);
        if (!cancelled) {
          setMine(mineRes.reports ?? []);
          setForMe(forMeRes.reports ?? []);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to load"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isProducer]);

  if (loading) return <LoadingSkeleton rows={4} />;
  if (error) return <InlineAlert variant="error">{error}</InlineAlert>;

  const renderList = (reports: ReportRow[], title: string, emptyMsg: string) => (
    <section className="mb-8">
      <h2 className="font-display text-lg font-semibold text-brand mb-3">{title}</h2>
      {reports.length === 0 ? (
        <p className="text-brand/70">{emptyMsg}</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-brand/10 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <ReportStatusBadge status={r.status} />
                {r.entityType === "order" && (
                  <>
                    {r.problemType && (
                      <span className="text-sm text-brand/80">{r.problemType.replace(/_/g, " ")}</span>
                    )}
                    {r.proposedOutcome && (
                      <span className="text-sm text-brand/70">→ {r.proposedOutcome.replace(/_/g, " ")}</span>
                    )}
                  </>
                )}
                <span className="text-sm text-brand/60 ml-auto">{formatDate(r.createdAt)}</span>
              </div>
              {r.entityType === "order" && (
                <Link
                  href={`/dashboard/orders/${r.entityId}`}
                  className="mt-2 inline-block text-sm text-brand-accent hover:underline"
                >
                  View order →
                </Link>
              )}
              {r.resolutionOutcome && (
                <p className="mt-2 text-sm text-brand/80">
                  Resolution: {r.resolutionOutcome.replace(/_/g, " ")}
                  {r.resolutionNote && ` — ${r.resolutionNote}`}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <>
      {renderList(mine, "Reports I filed", "You haven’t filed any reports.")}
      {isProducer && renderList(forMe, "Cases involving my orders", "No reports on your orders.")}
    </>
  );
}
