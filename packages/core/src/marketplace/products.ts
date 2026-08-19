import { db } from "@voltech/database";
import { generateSku } from "../ids";
import { notify, notifyAdmins } from "./notifications";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface VariantInput {
  options: Record<string, string>; // e.g. { Storage: "256GB", Color: "Black" }
  price: number;
  compareAtPrice?: number;
  stock: number;
  imageUrl?: string;
  sku?: string;
}

export interface CreateProductInput {
  sellerId: string;
  categoryId: string;
  brandId?: string;
  name: string;
  description: string;
  specifications?: Record<string, string>;
  basePrice: number;
  compareAtPrice?: number;
  weightGrams?: number;
  warrantyInfo?: string;
  shippingInfo?: string;
  images: { url: string; altText?: string }[];
  variants: VariantInput[]; // at least one — a variant-less product still gets a single implicit variant
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await db.product.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function createProduct(input: CreateProductInput) {
  if (input.variants.length === 0) throw new Error("At least one variant is required");

  const slug = await uniqueSlug(input.name);

  return db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sellerId: input.sellerId,
        categoryId: input.categoryId,
        brandId: input.brandId,
        name: input.name,
        slug,
        description: input.description,
        specifications: JSON.stringify(input.specifications ?? {}),
        basePrice: input.basePrice,
        compareAtPrice: input.compareAtPrice,
        weightGrams: input.weightGrams,
        warrantyInfo: input.warrantyInfo,
        shippingInfo: input.shippingInfo,
        status: "PENDING_APPROVAL",
        images: { create: input.images.map((img, i) => ({ url: img.url, altText: img.altText, sortOrder: i })) },
      },
    });

    for (const v of input.variants) {
      const sku = v.sku ?? generateSku(slug.slice(0, 6).toUpperCase());
      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          sku,
          optionsJson: JSON.stringify(v.options),
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          imageUrl: v.imageUrl,
          status: "ACTIVE",
        },
      });
      await tx.inventory.create({
        data: { productId: product.id, variantId: variant.id, onHand: v.stock },
      });
    }

    await notifyAdmins(tx, {
      type: "PRODUCT_PENDING_APPROVAL",
      title: "New product awaiting approval",
      body: `"${product.name}" was submitted for review.`,
      linkUrl: `/admin/products/${product.id}`,
    });

    return product;
  });
}

export async function updateProduct(
  productId: string,
  sellerId: string,
  patch: Partial<Pick<CreateProductInput, "name" | "description" | "basePrice" | "compareAtPrice" | "categoryId" | "brandId" | "weightGrams" | "warrantyInfo" | "shippingInfo">>,
) {
  const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
  if (product.sellerId !== sellerId) throw new Error("Not authorized");

  // Any edit to a live listing goes back through moderation.
  const goesBackToReview = product.status === "APPROVED";

  return db.product.update({
    where: { id: productId },
    data: {
      ...patch,
      status: goesBackToReview ? "PENDING_APPROVAL" : product.status,
    },
  });
}

export async function deleteProduct(productId: string, sellerId: string) {
  const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
  if (product.sellerId !== sellerId) throw new Error("Not authorized");
  const hasOrders = await db.orderItem.findFirst({ where: { productId } });
  if (hasOrders) {
    // Preserve order history integrity — suspend instead of hard-delete.
    return db.product.update({ where: { id: productId }, data: { status: "SUSPENDED" } });
  }
  return db.product.delete({ where: { id: productId } });
}

export async function decideProductApproval(productId: string, decision: "APPROVED" | "REJECTED", reason?: string) {
  const product = await db.product.update({
    where: { id: productId },
    data: { status: decision, rejectionReason: decision === "REJECTED" ? reason : null },
    include: { seller: true },
  });

  await notify(db, {
    userId: product.seller.userId,
    type: decision === "APPROVED" ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
    title: decision === "APPROVED" ? "Product approved" : "Product rejected",
    body: decision === "APPROVED" ? `"${product.name}" is now live.` : `"${product.name}" was rejected.${reason ? ` Reason: ${reason}` : ""}`,
    linkUrl: `/seller/products/${product.id}`,
  });

  return product;
}

export async function addVariant(productId: string, sellerId: string, v: VariantInput) {
  const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
  if (product.sellerId !== sellerId) throw new Error("Not authorized");

  return db.$transaction(async (tx) => {
    const sku = v.sku ?? generateSku(product.slug.slice(0, 6).toUpperCase());
    const variant = await tx.productVariant.create({
      data: {
        productId,
        sku,
        optionsJson: JSON.stringify(v.options),
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        imageUrl: v.imageUrl,
        status: "ACTIVE",
      },
    });
    await tx.inventory.create({ data: { productId, variantId: variant.id, onHand: v.stock } });
    return variant;
  });
}

export async function updateVariantPriceStock(variantId: string, sellerId: string, patch: { price?: number; compareAtPrice?: number | null; addStock?: number; status?: "ACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED" }) {
  const variant = await db.productVariant.findUniqueOrThrow({ where: { id: variantId }, include: { product: true } });
  if (variant.product.sellerId !== sellerId) throw new Error("Not authorized");

  if (patch.price !== undefined || patch.compareAtPrice !== undefined || patch.status !== undefined) {
    await db.productVariant.update({
      where: { id: variantId },
      data: { price: patch.price, compareAtPrice: patch.compareAtPrice, status: patch.status },
    });
  }
  if (patch.addStock) {
    const { restock } = await import("./inventory");
    await db.$transaction((tx) => restock(tx, variantId, sellerId, patch.addStock!, "Manual stock update"));
  }
}
