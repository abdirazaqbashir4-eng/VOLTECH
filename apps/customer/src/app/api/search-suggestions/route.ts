import { NextRequest, NextResponse } from "next/server";
import { db } from "@voltech/database";
import { auth } from "@/auth";
import { formatKES } from "@voltech/core/money";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const session = await auth();

  const recent = session?.user
    ? await db.searchHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        distinct: ["query"],
        take: 5,
        select: { query: true },
      })
    : [];

  if (q.length < 2) {
    const popular = await db.searchHistory.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 6,
    });
    return NextResponse.json({
      recent: recent.map((r) => r.query),
      trending: popular.map((p) => p.query),
    });
  }

  const [products, categories, brands] = await Promise.all([
    db.product.findMany({
      where: { status: "APPROVED", name: { contains: q } },
      select: {
        name: true,
        slug: true,
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        variants: { where: { status: "ACTIVE" }, orderBy: { price: "asc" }, take: 1, select: { price: true } },
      },
      take: 5,
    }),
    db.category.findMany({
      where: { status: "ACTIVE", name: { contains: q } },
      select: { name: true, slug: true },
      take: 3,
    }),
    db.brand.findMany({
      where: { name: { contains: q } },
      select: { name: true, slug: true },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    recent: recent.map((r) => r.query),
    products: products.map((p) => ({
      label: p.name,
      href: `/products/${p.slug}`,
      imageUrl: p.images[0]?.url ?? null,
      price: p.variants[0]?.price != null ? formatKES(p.variants[0].price) : null,
    })),
    categories: categories.map((c) => ({ label: c.name, href: `/categories/${c.slug}` })),
    brands: brands.map((b) => ({ label: b.name, href: `/search?q=${encodeURIComponent(b.name)}&brand=${b.slug}` })),
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  await db.searchHistory.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
