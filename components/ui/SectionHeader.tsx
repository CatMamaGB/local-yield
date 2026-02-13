"use client";

/**
 * Warm Farmhouse design system — Section header.
 * Slightly larger section heading, optional actions. Use for "Your location", "Find caregivers", etc.
 */

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, actions, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold text-brand sm:text-2xl leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-brand/80 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions != null && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
