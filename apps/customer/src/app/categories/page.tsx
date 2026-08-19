import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "All categories" };

export default async function CategoriesIndexPage() {
  const categories = await db.category.findMany({
    where: { status: "ACTIVE", parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } } },
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-lg font-bold text-slate-900">All categories</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-lg border border-[var(--border)] p-4">
              <Link href={`/categories/${cat.slug}`} className="font-semibold text-slate-900 hover:text-brand-teal">
                {cat.name}
              </Link>
              {cat.children.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {cat.children.map((c) => (
                    <li key={c.id}>
                      <Link href={`/categories/${c.slug}`} className="hover:text-brand-teal">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
