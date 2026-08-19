import { NextRequest, NextResponse } from "next/server";
import { db } from "@voltech/database";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    const popular = await db.searchHistory.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 6,
    });
    return NextResponse.json({ suggestions: popular.map((p) => p.query) });
  }

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { status: "APPROVED", name: { contains: q } },
      select: { name: true, slug: true },
      take: 5,
    }),
    db.category.findMany({
      where: { status: "ACTIVE", name: { contains: q } },
      select: { name: true, slug: true },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({ label: p.name, href: `/products/${p.slug}` })),
    categories: categories.map((c) => ({ label: c.name, href: `/categories/${c.slug}` })),
  });
}
