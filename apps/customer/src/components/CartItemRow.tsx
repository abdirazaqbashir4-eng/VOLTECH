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
    <div className="bg-surface-container-lowest border border-outline-variant rounded flex gap-stack-md p-stack-sm relative">
      <Link href={`/products/${item.productSlug}`} className="w-24 h-24 shrink-0 rounded bg-surface-container-high overflow-hidden relative">
        {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} fill sizes="96px" className="object-cover" />}
      </Link>
      <div className="flex flex-col justify-between flex-grow min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <Link href={`/products/${item.productSlug}`} className="font-headline-sm text-headline-sm line-clamp-2">
              {item.productName}
            </Link>
            {options && <p className="font-body-sm text-body-sm text-on-surface-variant">{options}</p>}
            {!item.inStock && <p className="font-body-sm text-body-sm text-error">Only {item.availableStock} left</p>}
          </div>
          <button disabled={isPending} onClick={remove} aria-label="Remove item" className="text-error p-1 -mr-2 -mt-2 shrink-0">
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
        <div className="flex justify-between items-end mt-2">
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm">{formatKES(item.lineSubtotal)}</span>
            <button disabled={isPending} onClick={saveForLater} className="font-body-sm text-body-sm text-secondary underline w-fit">
              Save for later
            </button>
          </div>
          <div className="flex items-center border border-outline-variant rounded">
            <button disabled={isPending} onClick={() => update(item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="w-8 text-center font-label-lg text-label-lg">{item.quantity}</span>
            <button disabled={isPending} onClick={() => update(item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
