"use client";

/**
 * Warm Farmhouse — Card: white bg, rounded-xl, soft shadow, optional header.
 */

interface SectionCardProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, actions, children, className = "" }: SectionCardProps) {
  return (
    <div
      className={`rounded-xl border border-brand/10 bg-white p-5 shadow-farmhouse sm:p-6 ${className}`}
    >
      {(title != null || actions != null) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-brand/10 pb-4">
          {title != null && (
            <h2 className="font-display text-xl font-semibold text-brand leading-tight">
              {title}
            </h2>
          )}
          {actions != null && <div className="ml-auto">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
