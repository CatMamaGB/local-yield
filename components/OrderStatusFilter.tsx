"use client";

export type OrderFilterStatus = "ALL" | "PENDING" | "FULFILLED";

export interface OrderStatusFilterProps {
  value: OrderFilterStatus;
  onChange: (value: OrderFilterStatus) => void;
  counts?: { pending: number; fulfilled: number };
  className?: string;
}

export function OrderStatusFilter({
  value,
  onChange,
  counts,
  className = "",
}: OrderStatusFilterProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange("ALL")}
        className={`rounded px-3 py-1.5 text-sm font-medium transition ${
          value === "ALL" ? "bg-brand text-white" : "border border-brand/30 text-brand hover:bg-brand-light"
        }`}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => onChange("PENDING")}
        className={`rounded px-3 py-1.5 text-sm font-medium transition ${
          value === "PENDING" ? "bg-brand text-white" : "border border-brand/30 text-brand hover:bg-brand-light"
        }`}
      >
        Pending{counts?.pending != null ? ` (${counts.pending})` : ""}
      </button>
      <button
        type="button"
        onClick={() => onChange("FULFILLED")}
        className={`rounded px-3 py-1.5 text-sm font-medium transition ${
          value === "FULFILLED" ? "bg-brand text-white" : "border border-brand/30 text-brand hover:bg-brand-light"
        }`}
      >
        Fulfilled{counts?.fulfilled != null ? ` (${counts.fulfilled})` : ""}
      </button>
    </div>
  );
}
