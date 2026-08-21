"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatKES } from "@voltech/core/money";

export default function TimeSeriesChart({
  data,
  dataKey,
  color = "#0d9488",
  valueLabel,
  currency,
}: {
  data: { date: string; value: number }[];
  dataKey?: string;
  color?: string;
  valueLabel: string;
  // A function prop can't cross the server->client boundary (RSC), so the
  // caller can't hand this component a formatter — it picks one itself
  // from this serializable flag instead.
  currency?: boolean;
}) {
  const formatValue = currency ? formatKES : undefined;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(v: number) => [formatValue ? formatValue(v) : v, valueLabel]}
        />
        <Line type="monotone" dataKey={dataKey ?? "value"} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
