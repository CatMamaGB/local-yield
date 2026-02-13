"use client";

/**
 * Warm Farmhouse design system — Badge.
 * Type: MARKET (soft green), CARE (soft blue). Status: PENDING (amber), FULFILLED (green), CANCELED (muted gray), PAID (blue).
 */

export type BadgeType = "MARKET" | "CARE";
export type BadgeStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELED" | "REFUNDED";

type BadgeVariant = BadgeType | BadgeStatus;

const variantStyles: Record<BadgeVariant, string> = {
  MARKET: "bg-emerald-100 text-emerald-800",
  CARE: "bg-sky-100 text-sky-800",
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-sky-100 text-sky-800",
  FULFILLED: "bg-emerald-100 text-emerald-800",
  CANCELED: "bg-neutral-100 text-neutral-600",
  REFUNDED: "bg-neutral-100 text-neutral-600",
};

export interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = "" }: BadgeProps) {
  const label = children ?? variant;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant] ?? "bg-brand-light text-brand"} ${className}`}
    >
      {label}
    </span>
  );
}
