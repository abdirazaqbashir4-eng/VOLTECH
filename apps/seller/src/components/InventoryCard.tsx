"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatKES } from "@voltech/core/money";
import { updateVariantAction, restockVariantAction } from "@/app/actions/products";

export interface InventoryItem {
  id: string;
  productName: string;
  imageUrl: string | null;
  options: Record<string, string>;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  status: string;
  onHand: number;
  reserved: number;
}

const STOCK_STYLES = {
  IN_STOCK: "bg-tertiary-fixed/30 text-on-tertiary-container",
  LOW_STOCK: "bg-secondary-fixed/40 text-on-secondary-fixed-variant",
  OUT_OF_STOCK: "bg-error-container text-on-error-container",
} as const;

export default function InventoryCard({ item }: { item: InventoryItem }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<"edit" | "restock" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [price, setPrice] = useState(String(item.price));
  const [restockQty, setRestockQty] = useState("");

  const available = item.onHand - item.reserved;
  const stockState = item.status === "OUT_OF_STOCK" || available <= 0 ? "OUT_OF_STOCK" : available <= 5 ? "LOW_STOCK" : "IN_STOCK";
  const stockLabel = stockState === "OUT_OF_STOCK" ? "Out of Stock" : stockState === "LOW_STOCK" ? `Low Stock (${available})` : `In Stock (${available})`;
  const optionsLabel = Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(", ");

  return (
    <div className={`bg-surface-container-lowest border border-outline-variant rounded p-3 flex flex-col gap-3 ${stockState === "OUT_OF_STOCK" ? "opacity-70" : ""}`}>
      <div className="flex gap-4 items-center">
        <div className={`w-16 h-16 flex-shrink-0 relative rounded bg-surface-container-low border border-outline-variant overflow-hidden ${stockState === "OUT_OF_STOCK" ? "grayscale" : ""}`}>
          {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className={`font-headline-sm text-headline-sm truncate pr-2 ${stockState === "OUT_OF_STOCK" ? "text-on-surface-variant" : "text-on-surface"}`}>
              {item.productName}
              {optionsLabel ? ` — ${optionsLabel}` : ""}
            </h3>
            <span className={`font-headline-sm text-headline-sm whitespace-nowrap ${stockState === "OUT_OF_STOCK" ? "text-on-surface-variant" : "text-on-surface"}`}>{formatKES(item.price)}</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">SKU: {item.sku}</p>
          <div className="flex justify-between items-center">
            <span className={`inline-flex items-center gap-1 font-label-md text-label-md px-2 py-0.5 rounded-full ${STOCK_STYLES[stockState]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" /> {stockLabel}
            </span>
            <div className="flex gap-3">
              {stockState === "OUT_OF_STOCK" && (
                <button type="button" onClick={() => setExpanded(expanded === "restock" ? null : "restock")} className="text-secondary hover:text-on-secondary-fixed-variant font-label-lg text-label-lg transition-colors">
                  Restock
                </button>
              )}
              <button type="button" onClick={() => setExpanded(expanded === "edit" ? null : "edit")} className="text-secondary hover:text-on-secondary-fixed-variant font-label-lg text-label-lg transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-outline-variant pt-3 flex flex-col gap-3">
          {expanded === "edit" && (
            <>
              <div className="flex items-center gap-2">
                <label className="font-body-sm text-body-sm text-on-surface-variant w-20 shrink-0">Price (KES)</label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  className="w-28 rounded border border-outline-variant px-2 py-1 font-body-sm text-body-sm"
                />
                <button
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await updateVariantAction(item.id, { price: Number(price) });
                      router.refresh();
                    })
                  }
                  className="font-label-md text-label-md text-secondary hover:underline"
                >
                  Save
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="font-body-sm text-body-sm text-on-surface-variant w-20 shrink-0">Status</label>
                <select
                  defaultValue={item.status}
                  onChange={(e) =>
                    startTransition(async () => {
                      await updateVariantAction(item.id, { status: e.target.value as "ACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED" });
                      router.refresh();
                    })
                  }
                  className="rounded border border-outline-variant px-2 py-1 font-body-sm text-body-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_STOCK">Out of stock</option>
                  <option value="DISCONTINUED">Discontinued</option>
                </select>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <label className="font-body-sm text-body-sm text-on-surface-variant w-20 shrink-0">Restock</label>
            <input
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              type="number"
              placeholder="Qty"
              className="w-20 rounded border border-outline-variant px-2 py-1 font-body-sm text-body-sm"
            />
            <button
              disabled={isPending || !restockQty}
              onClick={() =>
                startTransition(async () => {
                  await restockVariantAction(item.id, Number(restockQty));
                  setRestockQty("");
                  router.refresh();
                })
              }
              className="font-label-md text-label-md text-secondary hover:underline disabled:opacity-50"
            >
              Add stock
            </button>
            <span className="font-body-sm text-body-sm text-on-surface-variant">{item.onHand} on hand ({item.reserved} reserved)</span>
          </div>
        </div>
      )}
    </div>
  );
}
