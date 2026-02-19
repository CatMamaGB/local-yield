"use client";

/**
 * Order timeline: Placed → Paid → Preparing → Ready → Completed.
 * Maps existing order fields (no new statuses). Preparing is derived (after paid, before fulfilled).
 */

import { formatDate } from "@/lib/utils";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELED" | "REFUNDED";

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: string | Date;
  paidAt?: string | Date | null;
  fulfilledAt?: string | Date | null;
}

const STEPS = [
  { key: "placed", label: "Placed", dateKey: "createdAt" },
  { key: "paid", label: "Paid", dateKey: "paidAt" },
  { key: "preparing", label: "Preparing", dateKey: null },
  { key: "ready", label: "Ready", dateKey: "fulfilledAt" },
  { key: "completed", label: "Completed", dateKey: null },
] as const;

export function OrderTimeline({ status, createdAt, paidAt, fulfilledAt }: OrderTimelineProps) {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const paid = paidAt ? (typeof paidAt === "string" ? new Date(paidAt) : paidAt) : null;
  const fulfilled = fulfilledAt ? (typeof fulfilledAt === "string" ? new Date(fulfilledAt) : fulfilledAt) : null;

  const isCanceledOrRefunded = status === "CANCELED" || status === "REFUNDED";

  const stepStatus = (key: string): "done" | "current" | "upcoming" => {
    if (isCanceledOrRefunded) {
      if (key === "placed") return "done";
      if (key === "paid" && paid) return "done";
      return "upcoming";
    }
    switch (key) {
      case "placed":
        return "done";
      case "paid":
        return paid ? "done" : status === "PENDING" ? "current" : "upcoming";
      case "preparing":
        if (fulfilled) return "done";
        if (paid || status === "PAID") return "current";
        return "upcoming";
      case "ready":
        if (fulfilled) return "done";
        return paid ? "current" : "upcoming";
      case "completed":
        return status === "FULFILLED" ? "done" : "upcoming";
      default:
        return "upcoming";
    }
  };

  const stepDate = (key: string): string | null => {
    if (key === "placed") return formatDate(created);
    if (key === "paid" && paid) return formatDate(paid);
    if (key === "ready" && fulfilled) return formatDate(fulfilled);
    if (key === "completed" && fulfilled) return formatDate(fulfilled);
    return null;
  };

  return (
    <div className="mt-4 rounded-lg border border-brand/10 bg-brand-light/20 p-4">
      <p className="text-sm font-medium text-brand mb-3">Order timeline</p>
      <ol className="space-y-2">
        {STEPS.map((step, i) => {
          const state = stepStatus(step.key);
          const dateStr = stepDate(step.key);
          return (
            <li key={step.key} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  state === "done"
                    ? "bg-brand-accent text-white"
                    : state === "current"
                      ? "border-2 border-brand-accent text-brand-accent"
                      : "border border-brand/30 bg-white text-brand/50"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span className={state === "upcoming" ? "text-brand/60" : "text-brand"}>
                {step.label}
                {dateStr && <span className="ml-2 text-sm text-brand/70">({dateStr})</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
