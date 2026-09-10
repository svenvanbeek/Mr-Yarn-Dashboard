"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailyPoint } from "@/lib/margin";

const TEAL = "#2b6e6b";
const AMBER = "#b8862e";
const LINE_COLOR = "#dad6c9";

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
}

function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(new Date(iso));
}

export default function RevenueChart({ data, subtitle }: { data: DailyPoint[]; subtitle: string }) {
  const chartData = data.map((d) => ({ ...d, label: formatDateShort(d.date) }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h2 className="chart-title">Omzet en marge</h2>
        <span className="chart-subtitle">{subtitle}</span>
      </div>
      {chartData.length === 0 ? (
        <p className="empty-state">Geen orders in deze periode.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="omzetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAL} stopOpacity={0.25} />
                <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={LINE_COLOR} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8A8676" }} axisLine={{ stroke: LINE_COLOR }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#8A8676" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${Math.round(v / 1000)}k`}
            />
            <Tooltip formatter={(v: number) => formatEuro(v)} contentStyle={{ borderRadius: 2, border: `1px solid ${LINE_COLOR}`, fontSize: 12.5 }} />
            <Area type="monotone" dataKey="revenue" name="Omzet" stroke={TEAL} strokeWidth={2.5} fill="url(#omzetGrad)" />
            <Line type="monotone" dataKey="margin" name="Contributiemarge" stroke={AMBER} strokeWidth={2.5} dot={false} />
            <Legend wrapperStyle={{ fontSize: 12.5, paddingTop: 8 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
