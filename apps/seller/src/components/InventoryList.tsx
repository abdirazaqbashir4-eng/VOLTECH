"use client";

import { useMemo, useState } from "react";
import InventoryCard, { type InventoryItem } from "./InventoryCard";

export default function InventoryList({ items }: { items: InventoryItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [showFilter, setShowFilter] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !q || item.productName.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      const available = item.onHand - item.reserved;
      const stockState = item.status === "OUT_OF_STOCK" || available <= 0 ? "OUT_OF_STOCK" : available <= 5 ? "LOW_STOCK" : "IN_STOCK";
      if (statusFilter !== "ALL" && stockState !== statusFilter) return false;
      return true;
    });
  }, [items, query, statusFilter]);

  return (
    <div className="flex flex-col gap-stack-md">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by SKU or Name..."
            type="text"
            className="w-full pl-10 pr-3 h-11 bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilter((s) => !s)}
          className={`w-11 h-11 border border-outline-variant rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors ${showFilter ? "bg-surface-container-low" : "bg-surface-container-lowest"}`}
        >
          <span className="material-symbols-outlined">filter_list</span>
        </button>
      </div>

      {showFilter && (
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md border transition-colors ${
                statusFilter === s ? "border-secondary text-secondary bg-secondary/10" : "border-outline-variant text-on-surface-variant bg-surface-container-lowest"
              }`}
            >
              {s === "ALL" ? "All" : s === "IN_STOCK" ? "In Stock" : s === "LOW_STOCK" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant py-stack-md text-center">No matching products.</p>
        ) : (
          filtered.map((item) => <InventoryCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
