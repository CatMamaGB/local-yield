"use client";

/**
 * Preset date range links for analytics (7d, 30d, 90d).
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";

function getRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function AnalyticsDateLinks({ from, to }: { from?: string | null; to?: string | null }) {
  const searchParams = useSearchParams();
  const currentFrom = from ?? searchParams.get("from");
  const currentTo = to ?? searchParams.get("to");

  const preset7 = getRange(7);
  const preset30 = getRange(30);
  const preset90 = getRange(90);

  const is7 = !currentFrom && !currentTo;
  const is30 = currentFrom === preset30.from && currentTo === preset30.to;
  const is90 = currentFrom === preset90.from && currentTo === preset90.to;

  return (
    <div className="mt-4 flex gap-2">
      <Link
        href="/dashboard/analytics"
        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${!currentFrom && !currentTo ? "bg-brand text-white" : "border border-brand/30 text-brand hover:bg-brand-light"}`}
      >
        30 days
      </Link>
      <Link
        href={`/dashboard/analytics?from=${preset7.from}&to=${preset7.to}`}
        className="rounded-lg border border-brand/30 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
      >
        7 days
      </Link>
      <Link
        href={`/dashboard/analytics?from=${preset90.from}&to=${preset90.to}`}
        className="rounded-lg border border-brand/30 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
      >
        90 days
      </Link>
    </div>
  );
}
