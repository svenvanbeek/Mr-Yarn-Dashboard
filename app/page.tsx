import Link from "next/link";
import { computeDashboardData } from "@/lib/margin";
import KpiCards from "@/components/KpiCards";
import MarginTable from "@/components/MarginTable";
import LogoutButton from "@/components/LogoutButton";

// Deze waarde bepaalt hoe lang Next.js de opgehaalde API-data hergebruikt
// voordat hij bij een volgend bezoek opnieuw ophaalt. 3600 = 1 uur.
export const revalidate = 3600;

const PERIOD_OPTIONS = [7, 30, 90];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const defaultDays = Number(process.env.DEFAULT_PERIOD_DAYS || 30);
  const days = Number(searchParams.days) || defaultDays;

  const data = await computeDashboardData(days);

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Mr Yarn</h1>
          <p className="dashboard-subtitle">
            Contributiemarge per order · laatste {days} dagen · ververst elk uur
          </p>
        </div>
        <LogoutButton />
      </div>

      <div style={{ marginBottom: 24, fontSize: 14 }}>
        {PERIOD_OPTIONS.map((opt) => (
          <Link
            key={opt}
            href={`/?days=${opt}`}
            style={{
              marginRight: 16,
              fontWeight: opt === days ? 600 : 400,
              color: opt === days ? "var(--color-plum)" : "var(--color-ink-soft)",
              textDecoration: opt === days ? "underline" : "none",
            }}
          >
            {opt} dagen
          </Link>
        ))}
      </div>

      <KpiCards
        revenue={data.totals.revenue}
        margin={data.totals.margin}
        marginPct={data.totals.marginPct}
        orderCount={data.totals.orderCount}
      />

      <MarginTable orders={data.orders} />
    </main>
  );
}
