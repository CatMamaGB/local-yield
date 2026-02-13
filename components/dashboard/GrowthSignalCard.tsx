/**
 * Warm Farmhouse — Growth signal card for dashboard.
 */

interface GrowthSignalCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

export function GrowthSignalCard({ label, value, trend, subtitle }: GrowthSignalCardProps) {
  const trendColor =
    trend === "up"
      ? "text-brand-accent-bright"
      : trend === "down"
        ? "text-brand-terracotta"
        : "text-brand/80";

  return (
    <div className="rounded-xl border border-brand/10 bg-white p-5 shadow-farmhouse">
      <p className="text-sm font-medium text-brand/80">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className={`font-display text-2xl font-semibold leading-tight ${trendColor}`}>{value}</p>
        {trend && (
          <span className={`text-xs ${trendColor}`} aria-hidden>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-brand/70 leading-relaxed">{subtitle}</p>}
    </div>
  );
}
