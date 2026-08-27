import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import TopAppBar from "@/components/TopAppBar";
import BottomNavBar from "@/components/BottomNavBar";
import Footer from "@/components/Footer";
import { auth } from "@/auth";
import { getCartView } from "@voltech/core/marketplace/cart";

export const metadata: Metadata = { title: "All categories" };

const CATEGORY_ICONS: Record<string, string> = {
  "Phones & Tablets": "smartphone",
  Electronics: "headphones",
  Computing: "laptop_mac",
  Fashion: "checkroom",
  "Home & Living": "chair",
  "Beauty & Personal Care": "spa",
  Gaming: "sports_esports",
};

export default async function CategoriesIndexPage() {
  const [categories, session] = await Promise.all([
    db.category.findMany({
      where: { status: "ACTIVE", parentId: null },
      orderBy: { sortOrder: "asc" },
      include: { children: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, take: 5 } },
    }),
    auth(),
  ]);
  const cartCount = session?.user ? (await getCartView(session.user.id)).itemCount : 0;

  return (
    <>
      <TopAppBar variant="home" />
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-margin-mobile py-stack-md">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-stack-md">Categories</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-mobile">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
                <Link href={`/categories/${cat.slug}`} className="flex items-center justify-between p-stack-sm bg-surface-container-low border-b border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">{CATEGORY_ICONS[cat.name] ?? "category"}</span>
                    <h2 className="font-headline-sm text-headline-sm text-primary">{cat.name}</h2>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </Link>
                {cat.children.length > 0 && (
                  <div className="p-stack-sm grid grid-cols-2 gap-2">
                    {cat.children.map((c) => (
                      <Link key={c.id} href={`/categories/${c.slug}`} className="bg-surface-bright p-2 rounded text-center border border-surface-variant">
                        <span className="font-label-md text-label-md text-on-surface block line-clamp-1">{c.name}</span>
                      </Link>
                    ))}
                    <Link href={`/categories/${cat.slug}`} className="bg-surface-bright p-2 rounded text-center border border-surface-variant">
                      <span className="font-label-md text-label-md text-secondary block">View All</span>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNavBar cartCount={cartCount} />
    </>
  );
}
