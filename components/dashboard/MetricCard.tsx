/**
 * Warm Farmhouse — Metric card for dashboard.
 */

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  className?: string;
}

export function MetricCard({ label, value, subtitle, href, className = "" }: MetricCardProps) {
  const content = (
    <div className={`rounded-xl border border-brand/10 bg-white p-5 shadow-farmhouse transition hover:border-brand-accent/20 ${className}`}>
      <p className="text-sm font-medium text-brand/80">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand leading-tight sm:text-3xl">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-brand/70 leading-relaxed">{subtitle}</p>}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-xl">
        {content}
      </a>
    );
  }

  return content;
}
