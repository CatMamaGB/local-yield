"use client";

/**
 * Period tabs and Download CSV for Your records page.
 */

import { useRouter, useSearchParams } from "next/navigation";
import type { Period } from "@/lib/sales-summary";

interface RecordsClientProps {
  period: Period;
  periodLabel: string;
  periods: { value: Period; label: string }[];
  csvContent: string;
  periodLabelForFile: string;
}

export function RecordsClient({
  period,
  periodLabel,
  periods,
  csvContent,
  periodLabelForFile,
}: RecordsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setPeriod(value: Period) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("period", value);
    router.push(`/dashboard/records?${next.toString()}`);
  }

  function downloadCsv() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `your-records-${periodLabelForFile}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <nav className="flex rounded-lg border border-brand/20 bg-white p-1" aria-label="Time period">
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              period === p.value
                ? "bg-brand text-white"
                : "text-brand/80 hover:bg-brand-light hover:text-brand"
            }`}
          >
            {p.label}
          </button>
        ))}
      </nav>
      <button
        type="button"
        onClick={downloadCsv}
        className="rounded-lg border border-brand/20 bg-white px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
      >
        Download CSV
      </button>
    </div>
  );
}
