"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { CostBreakdownItem } from "@/lib/margin";

const AMBER = "#b8862e";
const LINE_COLOR = "#dad6c9";
const INK = "#1e2422";

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
}

export default function CostBreakdownChart({ data, subtitle }: { data: CostBreakdownItem[]; subtitle: string }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h2 className="chart-title">Kostenopbouw</h2>
        <span className="chart-subtitle">{subtitle}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="empty-state">Nog geen kosten geregistreerd deze periode.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, sorted.length * 34)}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke={LINE_COLOR} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#8A8676" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
            <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11.5, fill: INK }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => formatEuro(v)} contentStyle={{ borderRadius: 2, border: `1px solid ${LINE_COLOR}`, fontSize: 12.5 }} />
            <Bar dataKey="value" fill={AMBER} radius={[0, 2, 2, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
