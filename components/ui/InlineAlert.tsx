"use client";

/**
 * Warm Farmhouse — Inline alert: info, success, warning, error (earthy tones).
 */

type Variant = "info" | "success" | "warning" | "error";

const variantStyles: Record<Variant, string> = {
  info: "border-brand-accent/30 bg-brand-accent/5 text-brand",
  success: "border-brand-accent-bright/30 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-brand-terracotta/40 bg-brand-terracotta/10 text-brand",
};

interface InlineAlertProps {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  role?: "alert" | "status";
}

export function InlineAlert({
  variant = "error",
  title,
  children,
  className = "",
  role = "alert",
}: InlineAlertProps) {
  return (
    <div
      role={role}
      className={`rounded-xl border p-4 text-sm leading-relaxed ${variantStyles[variant]} ${className}`}
    >
      {title && <p className="font-medium">{title}</p>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}
