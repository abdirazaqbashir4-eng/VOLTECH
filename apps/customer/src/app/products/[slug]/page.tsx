import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import TopAppBar from "@/components/TopAppBar";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ProductCard from "@/components/ProductCard";
import ProductCarousel from "@/components/ProductCarousel";
import RatingStars from "@/components/RatingStars";
import ReviewForm from "@/components/ReviewForm";
import ReviewsSection from "@/components/ReviewsSection";
import SellerCard from "@/components/SellerCard";
import ProductTabs from "@/components/ProductTabs";
import { toCardData } from "@/lib/catalog";
import { availableStock } from "@voltech/core/marketplace/inventory";
import { getEligibleOrdersForReview } from "@voltech/core/marketplace/reviews";
import { auth } from "@/auth";

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { inventory: true } },
      seller: true,
      category: true,
      brand: true,
      reviews: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 20, include: { customer: { select: { fullName: true } } } },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description.slice(0, 160),
    alternates: { canonical: `/products/${slug}` },
    openGraph: { images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default async function ProductDetailPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const session = await auth();

  if (session?.user) {
    await db.recentlyViewed
      .upsert({
        where: { userId_productId: { userId: session.user.id, productId: product.id } },
        update: { viewedAt: new Date() },
        create: { userId: session.user.id, productId: product.id },
      })
      .catch(() => {});
  }
  await db.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const [wishlistItem, related, eligibleOrders, sellerProductCount, ratingGroups] = await Promise.all([
    session?.user ? db.wishlistItem.findUnique({ where: { userId_productId: { userId: session.user.id, productId: product.id } } }) : null,
    db.product.findMany({
      where: { categoryId: product.categoryId, status: "APPROVED", id: { not: product.id } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { where: { status: "ACTIVE" } }, seller: { select: { storeName: true, status: true } } },
      take: 10,
    }),
    session?.user ? getEligibleOrdersForReview(session.user.id, product.id) : Promise.resolve([]),
    db.product.count({ where: { sellerId: product.sellerId, status: "APPROVED" } }),
    db.review.groupBy({ by: ["rating"], where: { productId: product.id, status: "PUBLISHED" }, _count: { rating: true } }),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const g of ratingGroups) distribution[g.rating as 1 | 2 | 3 | 4 | 5] = g._count.rating;

  const variantOptions = product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    options: JSON.parse(v.optionsJson) as Record<string, string>,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    available: v.inventory ? availableStock(v.inventory) : 0,
    status: v.status,
  }));

  const specs = JSON.parse(product.specifications) as Record<string, string>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.basePrice,
      availability: variantOptions.some((v) => v.available > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.ratingCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.ratingCount }
        : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TopAppBar variant="subpage" title={product.name} backHref={`/categories/${product.category.slug}`} />
      <main className="pb-32">
        <div className="lg:mx-auto lg:max-w-7xl lg:grid lg:gap-8 lg:px-6 lg:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
          <ProductGallery images={product.images} name={product.name} />

          {/* Product Header */}
          <section className="px-margin-mobile py-stack-md bg-surface-container-lowest border-b border-outline-variant lg:border lg:rounded-lg">
            <h1 className="font-headline-md text-headline-md text-on-surface mb-stack-xs">{product.name}</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-stack-sm">SKU: {product.variants[0]?.sku}</p>
            <div className="flex items-center gap-2 mb-stack-md">
              {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} />}
              <Link href={`/store/${product.seller.storeSlug}`} className="font-body-sm text-body-sm text-secondary underline decoration-outline-variant">
                {product.seller.storeName}
              </Link>
            </div>

            <ProductPurchasePanel
              productId={product.id}
              variants={variantOptions}
              initiallyWishlisted={!!wishlistItem}
              isAuthenticated={!!session?.user}
            />

            <div className="mt-stack-lg flex items-start gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              <div>
                <p className="font-body-sm text-body-sm text-on-surface font-semibold">
                  {product.shippingInfo || "Delivery fee and date confirmed at checkout"}
                </p>
              </div>
            </div>

            {product.warrantyInfo && (
              <div className="mt-stack-md rounded border border-outline-variant p-stack-md font-body-sm text-body-sm text-on-surface-variant">
                🛡️ {product.warrantyInfo}
              </div>
            )}
          </section>

          <div className="px-margin-mobile py-stack-md lg:px-0 lg:py-0">
            <SellerCard
              storeName={product.seller.storeName}
              storeSlug={product.seller.storeSlug}
              ratingAvg={product.seller.ratingAvg}
              ratingCount={product.seller.ratingCount}
              productCount={sellerProductCount}
              verified={product.seller.status === "APPROVED"}
            />
          </div>
        </div>

        <section className="mt-4 px-margin-mobile lg:mx-auto lg:max-w-7xl lg:px-6">
          <ProductTabs
            tabs={[
              {
                id: "description",
                label: "Description",
                content: <p className="whitespace-pre-line text-sm text-slate-700">{product.description}</p>,
              },
              ...(Object.keys(specs).length > 0
                ? [
                    {
                      id: "specifications",
                      label: "Specifications",
                      content: (
                        <table className="w-full max-w-2xl text-sm">
                          <tbody>
                            {Object.entries(specs).map(([k, v]) => (
                              <tr key={k} className="border-b border-[var(--border)]">
                                <td className="py-1.5 pr-4 font-medium text-slate-600">{k}</td>
                                <td className="py-1.5 text-slate-800">{v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ),
                    },
                  ]
                : []),
              {
                id: "reviews",
                label: `Reviews${product.ratingCount > 0 ? ` (${product.ratingCount})` : ""}`,
                content: (
                  <div className="grid gap-8 lg:grid-cols-2">
                    <ReviewsSection
                      productId={product.id}
                      initialReviews={product.reviews.map((r) => ({
                        id: r.id,
                        rating: r.rating,
                        title: r.title,
                        body: r.body,
                        images: JSON.parse(r.imagesJson) as string[],
                        verifiedPurchase: r.verifiedPurchase,
                        createdAt: r.createdAt.toISOString(),
                        customerName: r.customer.fullName,
                      }))}
                      distribution={distribution}
                      ratingCount={product.ratingCount}
                    />
                    <ReviewForm productId={product.id} productSlug={product.slug} orders={eligibleOrders.map((o) => ({ id: o.id, orderNumber: o.orderNumber }))} />
                  </div>
                ),
              },
              {
                id: "shipping",
                label: "Shipping",
                content: (
                  <p className="text-sm text-slate-700">
                    {product.shippingInfo || "Delivery fees and estimated delivery dates are calculated at checkout based on your address."}
                  </p>
                ),
              },
              {
                id: "returns",
                label: "Return policy",
                content: (
                  <p className="text-sm text-slate-700">
                    Eligible items can be returned from your order history within the return window shown on the order. See{" "}
                    <Link href="/help" className="text-brand-teal hover:underline">the help center</Link> for details.
                  </p>
                ),
              },
              {
                id: "warranty",
                label: "Warranty",
                content: <p className="text-sm text-slate-700">{product.warrantyInfo || "No manufacturer warranty specified for this product."}</p>,
              },
            ]}
          />
        </section>

        {related.length > 0 && (
          <div className="px-margin-mobile lg:mx-auto lg:max-w-7xl lg:px-6">
            <ProductCarousel title="You may also like">
              {related.filter((p) => p.variants.length > 0).map((p) => (
                <div key={p.slug} className="w-[46%] shrink-0 sm:w-[31%] lg:w-[19%]">
                  <ProductCard product={toCardData(p)} isAuthenticated={!!session?.user} />
                </div>
              ))}
            </ProductCarousel>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
