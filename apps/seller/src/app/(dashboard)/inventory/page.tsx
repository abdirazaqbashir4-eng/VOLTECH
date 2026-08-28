import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";
import InventoryList from "@/components/InventoryList";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const { seller } = await requireSeller();

  const variants = await db.productVariant.findMany({
    where: { product: { sellerId: seller.id } },
    include: {
      inventory: true,
      product: { select: { name: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const items = variants.map((v) => ({
    id: v.id,
    productName: v.product.name,
    imageUrl: v.product.images[0]?.url ?? null,
    options: JSON.parse(v.optionsJson) as Record<string, string>,
    sku: v.sku,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    status: v.status,
    onHand: v.inventory?.onHand ?? 0,
    reserved: v.inventory?.reserved ?? 0,
  }));

  return (
    <div className="flex flex-col gap-stack-lg max-w-3xl">
      <div className="flex flex-col gap-stack-sm md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Inventory Management</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Manage stock, update pricing, and monitor status.</p>
        </div>
        <Link
          href="/products/new"
          className="bg-secondary text-on-secondary font-label-lg text-label-lg px-4 h-touch-target-min rounded flex items-center justify-center gap-2 hover:bg-on-secondary-fixed-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Product
        </Link>
      </div>

      <InventoryList items={items} />
    </div>
  );
}
