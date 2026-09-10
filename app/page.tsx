import Link from "next/link";
import { computeDashboardData } from "@/lib/margin";
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/periods";
import KpiCards from "@/components/KpiCards";
import MarginTable from "@/components/MarginTable";
import LogoutButton from "@/components/LogoutButton";
import RevenueChart from "@/components/RevenueChart";
import CostBreakdownChart from "@/components/CostBreakdownChart";

// Deze waarde bepaalt hoe lang Next.js de opgehaalde API-data hergebruikt
// voordat hij bij een volgend bezoek opnieuw ophaalt. 3600 = 1 uur.
export const revalidate = 3600;

const VALID_KEYS = PERIOD_OPTIONS.map((o) => o.key);

function isValidPeriod(value: string | undefined): value is PeriodKey {
  return !!value && (VALID_KEYS as string[]).includes(value);
}

function formatRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const defaultPeriod = (process.env.DEFAULT_PERIOD || "mtd") as PeriodKey;
  const periodKey: PeriodKey = isValidPeriod(searchParams.period) ? searchParams.period : defaultPeriod;

  const data = await computeDashboardData(periodKey);
  const periodeLabel = formatRange(data.period.currentStart, data.period.currentEnd);

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">Contributiemarge-dashboard — live data, ververst elk uur</div>
          <h1 className="dashboard-title">Bedrijfsoverzicht — {periodeLabel}</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="period-row">
        {PERIOD_OPTIONS.map((opt) => (
          <Link
            key={opt.key}
            href={`/?period=${opt.key}`}
            className={`period-btn ${opt.key === periodKey ? "active" : ""}`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <KpiCards totals={data.totals} previousTotals={data.previousTotals} />

      <div className="chart-grid">
        <RevenueChart data={data.daily} subtitle={periodeLabel} />
        <CostBreakdownChart data={data.costBreakdown} subtitle={periodeLabel} />
      </div>

      <MarginTable orders={data.orders} />
    </main>
  );
}
