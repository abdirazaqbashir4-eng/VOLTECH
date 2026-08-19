import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireSeller } from "@/lib/session";
import ProductForm from "@/components/ProductForm";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireSeller();
  const [categories, brands] = await Promise.all([
    db.category.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Add a product</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
