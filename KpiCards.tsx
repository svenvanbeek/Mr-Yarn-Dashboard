function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
}

export default function KpiCards({
  revenue,
  margin,
  marginPct,
  orderCount,
}: {
  revenue: number;
  margin: number;
  marginPct: number;
  orderCount: number;
}) {
  return (
    <div className="kpi-row">
      <div className="kpi-card">
        <p className="kpi-label">Omzet</p>
        <p className="kpi-value">{formatEuro(revenue)}</p>
      </div>
      <div className="kpi-card">
        <p className="kpi-label">Contributiemarge</p>
        <p className={`kpi-value ${margin >= 0 ? "positive" : "negative"}`}>{formatEuro(margin)}</p>
      </div>
      <div className="kpi-card">
        <p className="kpi-label">Marge %</p>
        <p className={`kpi-value ${marginPct >= 0 ? "positive" : "negative"}`}>
          {marginPct.toFixed(1)}%
        </p>
      </div>
      <div className="kpi-card">
        <p className="kpi-label">Orders</p>
        <p className="kpi-value">{orderCount}</p>
      </div>
    </div>
  );
}
