"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
}

export default function SalesLineChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(value: number, name: string) => [name === "revenue" ? `KES ${value.toLocaleString()}` : value, name === "revenue" ? "Revenue" : "Orders"]}
        />
        <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
