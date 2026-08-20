"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVariantAction, restockVariantAction } from "@/app/actions/products";

export default function VariantRow({
  variant,
}: {
  variant: { id: string; sku: string; options: Record<string, string>; price: number; compareAtPrice: number | null; status: string; onHand: number; reserved: number };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [price, setPrice] = useState(String(variant.price));
  const [restockQty, setRestockQty] = useState("");

  const optionsLabel = Object.entries(variant.options).map(([k, v]) => `${k}: ${v}`).join(", ") || "Default";

  return (
    <tr className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--surface)]">
      <td className="px-4 py-2 text-sm">
        <p className="font-medium text-slate-900">{optionsLabel}</p>
        <p className="text-xs text-slate-500">{variant.sku}</p>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            step="0.01"
            className="w-24 rounded border border-[var(--border)] px-2 py-1 text-sm"
          />
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await updateVariantAction(variant.id, { price: Number(price) });
                router.refresh();
              })
            }
            className="text-xs text-brand-teal hover:underline"
          >
            Save
          </button>
        </div>
      </td>
      <td className="px-4 py-2 text-sm">
        {variant.onHand} on hand ({variant.reserved} reserved)
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <input value={restockQty} onChange={(e) => setRestockQty(e.target.value)} type="number" placeholder="Qty" className="w-16 rounded border border-[var(--border)] px-2 py-1 text-sm" />
          <button
            disabled={isPending || !restockQty}
            onClick={() =>
              startTransition(async () => {
                await restockVariantAction(variant.id, Number(restockQty));
                setRestockQty("");
                router.refresh();
              })
            }
            className="text-xs text-brand-teal hover:underline"
          >
            Restock
          </button>
        </div>
      </td>
      <td className="px-4 py-2">
        <select
          defaultValue={variant.status}
          onChange={(e) =>
            startTransition(async () => {
              await updateVariantAction(variant.id, { status: e.target.value as "ACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED" });
              router.refresh();
            })
          }
          className="rounded border border-[var(--border)] px-2 py-1 text-xs"
        >
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
          <option value="DISCONTINUED">Discontinued</option>
        </select>
      </td>
    </tr>
  );
}
