"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface ProductBar {
  name: string;
  unitsSold: number;
}

export default function TopProductsChart({ data }: { data: ProductBar[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} formatter={(v: number) => [v, "Units sold"]} />
        <Bar dataKey="unitsSold" fill="#0d9488" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
