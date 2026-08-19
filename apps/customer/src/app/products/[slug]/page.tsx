import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@voltech/database";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ProductCard from "@/components/ProductCard";
import ProductCarousel from "@/components/ProductCarousel";
import RatingStars from "@/components/RatingStars";
import ReviewForm from "@/components/ReviewForm";
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

  const [wishlistItem, related, eligibleOrders, sellerProductCount] = await Promise.all([
    session?.user ? db.wishlistItem.findUnique({ where: { userId_productId: { userId: session.user.id, productId: product.id } } }) : null,
    db.product.findMany({
      where: { categoryId: product.categoryId, status: "APPROVED", id: { not: product.id } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { where: { status: "ACTIVE" } }, seller: { select: { storeName: true, status: true } } },
      take: 10,
    }),
    session?.user ? getEligibleOrdersForReview(session.user.id, product.id) : Promise.resolve([]),
    db.product.count({ where: { sellerId: product.sellerId, status: "APPROVED" } }),
  ]);

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
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <nav className="mb-4 text-xs text-slate-500">
          <Link href="/" className="hover:text-brand-teal">Home</Link> /{" "}
          <Link href={`/categories/${product.category.slug}`} className="hover:text-brand-teal">{product.category.name}</Link> /{" "}
          <span className="text-slate-700">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
          <ProductGallery images={product.images} name={product.name} />

          <div>
            <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} />}
              <Link href={`/store/${product.seller.storeSlug}`} className="text-sm text-brand-teal hover:underline">
                {product.seller.storeName}
              </Link>
            </div>

            <div className="mt-5">
              <ProductPurchasePanel
                productId={product.id}
                variants={variantOptions}
                initiallyWishlisted={!!wishlistItem}
                isAuthenticated={!!session?.user}
              />
            </div>

            {(product.warrantyInfo || product.shippingInfo) && (
              <div className="mt-6 space-y-1 rounded-lg border border-[var(--border)] p-4 text-sm text-slate-600">
                {product.shippingInfo && <p>🚚 {product.shippingInfo}</p>}
                {product.warrantyInfo && <p>🛡️ {product.warrantyInfo}</p>}
              </div>
            )}
          </div>

          <div>
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

        <section className="mt-10">
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
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      {product.reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
                      {product.reviews.map((r) => (
                        <div key={r.id} className="border-b border-[var(--border)] pb-4">
                          <div className="flex items-center gap-2">
                            <RatingStars value={r.rating} />
                            <span className="text-sm font-medium text-slate-800">{r.customer.fullName}</span>
                            {r.verifiedPurchase && <span className="text-xs text-green-700">Verified purchase</span>}
                          </div>
                          {r.title && <p className="mt-1 font-medium text-slate-900">{r.title}</p>}
                          {r.body && <p className="mt-1 text-sm text-slate-600">{r.body}</p>}
                        </div>
                      ))}
                    </div>
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
          <ProductCarousel title="You may also like">
            {related.filter((p) => p.variants.length > 0).map((p) => (
              <div key={p.slug} className="w-[46%] shrink-0 sm:w-[31%] lg:w-[19%]">
                <ProductCard product={toCardData(p)} isAuthenticated={!!session?.user} />
              </div>
            ))}
          </ProductCarousel>
        )}
      </main>
      <Footer />
    </>
  );
}
