"use client";

/**
 * Warm Farmhouse — Loading skeletons for list pages and dashboards.
 */

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 4, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 w-full animate-pulse rounded-xl border border-brand/10 bg-white shadow-farmhouse"
          aria-hidden
        />
      ))}
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-20 w-full animate-pulse rounded-xl border border-brand/10 bg-white shadow-farmhouse ${className}`}
      aria-hidden
    />
  );
}
