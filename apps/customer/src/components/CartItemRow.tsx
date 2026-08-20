"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatKES } from "@voltech/core/money";
import { updateCartItemAction, removeCartItemAction, saveForLaterAction } from "@/app/actions/cart";

export interface CartRowData {
  cartItemId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  variantOptions: Record<string, string>;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineSubtotal: number;
  availableStock: number;
  inStock: boolean;
}

export default function CartItemRow({ item }: { item: CartRowData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(qty: number) {
    startTransition(async () => {
      await updateCartItemAction(item.cartItemId, qty);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItemAction(item.cartItemId);
      router.refresh();
    });
  }

  function saveForLater() {
    startTransition(async () => {
      await saveForLaterAction(item.cartItemId, true);
      router.refresh();
    });
  }

  const options = Object.entries(item.variantOptions).map(([k, v]) => `${k}: ${v}`).join(", ");

  return (
    <div className="flex gap-4 border-b border-[var(--border)] py-4">
      <Link href={`/products/${item.productSlug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-slate-100">
        {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} fill sizes="80px" className="object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col gap-1">
        <Link href={`/products/${item.productSlug}`} className="text-sm font-medium text-slate-900 hover:text-brand-teal">
          {item.productName}
        </Link>
        {options && <p className="text-xs text-slate-500">{options}</p>}
        {!item.inStock && <p className="text-xs text-red-600">Only {item.availableStock} left in stock</p>}

        <div className="mt-1 flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-lg border border-[var(--border)] transition-colors">
            <button disabled={isPending} onClick={() => update(item.quantity - 1)} className="px-2.5 py-1 text-slate-600 hover:bg-[var(--surface)]">
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button disabled={isPending} onClick={() => update(item.quantity + 1)} className="px-2.5 py-1 text-slate-600 hover:bg-[var(--surface)]">
              +
            </button>
          </div>
          <button disabled={isPending} onClick={remove} className="text-xs text-slate-500 hover:text-red-600">
            Remove
          </button>
          <button disabled={isPending} onClick={saveForLater} className="text-xs text-slate-500 hover:text-brand-teal">
            Save for later
          </button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-slate-900">{formatKES(item.lineSubtotal)}</p>
        {item.compareAtPrice && item.compareAtPrice > item.unitPrice && (
          <p className="text-xs text-slate-400 line-through">{formatKES(item.compareAtPrice * item.quantity)}</p>
        )}
      </div>
    </div>
  );
}
