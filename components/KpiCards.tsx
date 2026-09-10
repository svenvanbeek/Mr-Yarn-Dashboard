import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { PeriodTotals } from "@/lib/margin";

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const positive = delta >= 0;
  return (
    <div className={`kpi-delta ${positive ? "positive" : "negative"}`}>
      {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      <span>{Math.abs(delta).toFixed(1)}% vs vorige periode</span>
    </div>
  );
}

export default function KpiCards({
  totals,
  previousTotals,
}: {
  totals: PeriodTotals;
  previousTotals: PeriodTotals;
}) {
  return (
    <div className="kpi-row">
      <div className="kpi-card">
        <p className="kpi-label">Omzet (excl. btw)</p>
        <p className="kpi-value">{formatEuro(totals.revenue)}</p>
        <DeltaBadge current={totals.revenue} previous={previousTotals.revenue} />
      </div>
      <div className="kpi-card">
        <p className="kpi-label">Contributiemarge</p>
        <p className={`kpi-value ${totals.margin >= 0 ? "" : "negative"}`}>{formatEuro(totals.margin)}</p>
        <DeltaBadge current={totals.margin} previous={previousTotals.margin} />
      </div>
      <div className="kpi-card">
        <p className="kpi-label">Marge %</p>
        <p className={`kpi-value ${totals.marginPct >= 0 ? "" : "negative"}`}>{totals.marginPct.toFixed(1)}%</p>
        <DeltaBadge current={totals.marginPct} previous={previousTotals.marginPct} />
      </div>
      <div className="kpi-card">
        <p className="kpi-label">Orders</p>
        <p className="kpi-value">{totals.orderCount}</p>
        <DeltaBadge current={totals.orderCount} previous={previousTotals.orderCount} />
      </div>
    </div>
  );
}
