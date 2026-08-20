import type { Metadata } from "next";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";
import CategoryForm from "@/components/CategoryForm";
import CategoryStatusToggle from "@/components/CategoryStatusToggle";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await db.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { products: true } }, parent: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Categories</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-xs">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Parent</th>
                  <th className="px-4 py-2">Products</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-2 text-slate-500">{c.parent?.name ?? "—"}</td>
                    <td className="px-4 py-2">{c._count.products}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-2"><CategoryStatusToggle categoryId={c.id} status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <CategoryForm categories={categories.filter((c) => !c.parentId)} />
      </div>
    </div>
  );
}
