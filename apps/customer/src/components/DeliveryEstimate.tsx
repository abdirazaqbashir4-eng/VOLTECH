"use client";

import { useEffect, useState, useTransition } from "react";
import { formatKES } from "@voltech/core/money";
import { getShippingMethodsForCounty } from "@/app/actions/checkout";

const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos", "Kajiado", "Nyeri", "Kilifi",
];

interface ShippingMethod {
  id: string;
  name: string;
  fee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

function formatEstimate(min: number, max: number) {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() + min);
  const to = new Date(now);
  to.setDate(now.getDate() + max);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return min === max ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}

export default function DeliveryEstimate({ defaultCounty = "Nairobi" }: { defaultCounty?: string }) {
  const [county, setCounty] = useState(defaultCounty);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function load(c: string) {
    startTransition(async () => {
      const result = await getShippingMethodsForCounty(c);
      setMethods(result);
    });
  }

  useEffect(() => {
    load(defaultCounty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cheapest = methods[0];

  return (
    <div className="rounded-lg border border-[var(--border)] p-4 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-900">📍 Deliver to {county}</p>
        <button type="button" onClick={() => setEditing((e) => !e)} className="text-xs text-brand-teal hover:underline">
          Change
        </button>
      </div>

      {editing && (
        <select
          value={county}
          onChange={(e) => {
            setCounty(e.target.value);
            load(e.target.value);
            setEditing(false);
          }}
          className="mt-2 w-full rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
        >
          {KENYA_COUNTIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      <div className="mt-2 space-y-1 text-slate-600">
        {isPending ? (
          <p className="text-xs text-slate-400">Checking delivery options...</p>
        ) : methods.length === 0 ? (
          <p className="text-xs text-red-600">Delivery isn&apos;t currently available to {county}.</p>
        ) : (
          methods.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <span>{m.name} · Estimated {formatEstimate(m.estimatedDaysMin, m.estimatedDaysMax)}</span>
              <span className="font-medium text-slate-800">{m.fee === 0 ? "Free" : formatKES(m.fee)}</span>
            </div>
          ))
        )}
      </div>
      {cheapest && (
        <p className="mt-2 text-xs text-slate-400">Exact delivery fee and date are confirmed at checkout.</p>
      )}
    </div>
  );
}
