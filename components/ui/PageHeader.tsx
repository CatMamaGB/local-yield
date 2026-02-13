"use client";

/**
 * Warm Farmhouse — Page header: serif title, optional subtitle, optional actions.
 */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold text-brand leading-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-brand/80 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
