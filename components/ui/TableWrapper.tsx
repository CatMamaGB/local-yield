"use client";

/**
 * Warm Farmhouse — Table wrapper: rounded-xl, soft border, shadow.
 * Use around <table> for consistent styling.
 */

export function TableWrapper({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse ${className}`}
    >
      {children}
    </div>
  );
}

export const tableHeaderRow = "border-b border-brand/10 bg-brand-light/40";
export const tableHeaderCell = "py-3 pl-4 pr-4 text-left font-display font-semibold text-brand";
export const tableBodyRow = "border-b border-brand/10 transition hover:bg-brand-light/30 last:border-0";
export const tableBodyCell = "py-3 pl-4 pr-4 text-sm text-brand";
