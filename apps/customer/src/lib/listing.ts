import { db } from "@voltech/database";
import type { Prisma } from "@voltech/database";

export interface ListingFilters {
  categorySlug?: string;
  q?: string;
  brand?: string;
  seller?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  discountedOnly?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "rating" | "popular" | "discount";
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE_DEFAULT = 24;

export async function queryListing(filters: ListingFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE_DEFAULT;

  const where: Prisma.ProductWhereInput = { status: "APPROVED" };

  if (filters.categorySlug) {
    const category = await db.category.findUnique({ where: { slug: filters.categorySlug } });
    if (category) {
      const children = await db.category.findMany({ where: { parentId: category.id }, select: { id: true } });
      const ids = [category.id, ...children.map((c) => c.id)];
      where.categoryId = { in: ids };
    } else {
      where.categoryId = "__none__";
    }
  }

  if (filters.q) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { brand: { name: { contains: q } } },
      { seller: { storeName: { contains: q } } },
      { variants: { some: { sku: { contains: q } } } },
    ];
  }

  if (filters.brand) where.brand = { slug: filters.brand };
  if (filters.seller) where.seller = { storeSlug: filters.seller };
  if (filters.minRating) where.ratingAvg = { gte: filters.minRating };
  if (filters.discountedOnly) where.compareAtPrice = { not: null };

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.variants = {
      some: {
        price: {
          gte: filters.minPrice ?? undefined,
          lte: filters.maxPrice ?? undefined,
        },
      },
    };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { soldCount: "desc" };
  switch (filters.sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "rating":
      orderBy = { ratingAvg: "desc" };
      break;
    case "popular":
      orderBy = { soldCount: "desc" };
      break;
    case "price_asc":
    case "price_desc":
    case "discount":
    case "relevance":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const include = {
    images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
    variants: { where: { status: "ACTIVE" as const } },
    seller: { select: { storeName: true } },
  };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy, include, skip: (page - 1) * pageSize, take: pageSize }),
  ]);

  let items = products.filter((p) => p.variants.length > 0);

  if (filters.sort === "price_asc" || filters.sort === "price_desc") {
    items = items.sort((a, b) => {
      const minA = Math.min(...a.variants.map((v) => v.price));
      const minB = Math.min(...b.variants.map((v) => v.price));
      return filters.sort === "price_asc" ? minA - minB : minB - minA;
    });
  }
  if (filters.sort === "discount") {
    const discountPct = (p: (typeof items)[number]) => {
      const v = p.variants.reduce((min, v) => (v.price < min.price ? v : min), p.variants[0]);
      return v.compareAtPrice ? (v.compareAtPrice - v.price) / v.compareAtPrice : 0;
    };
    items = items.sort((a, b) => discountPct(b) - discountPct(a));
  }

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFilterOptions() {
  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);
  return { brands, categories };
}
