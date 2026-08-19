"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/session";
import { createProduct, updateProduct, deleteProduct, addVariant, updateVariantPriceStock, type VariantInput } from "@voltech/core/marketplace/products";
import { restock } from "@voltech/core/marketplace/inventory";
import { db } from "@voltech/database";

function parseVariants(formData: FormData): VariantInput[] {
  const raw = String(formData.get("variantsJson") ?? "[]");
  const parsed = JSON.parse(raw) as { options: Record<string, string>; price: number; compareAtPrice?: number; stock: number }[];
  return parsed.map((v) => ({
    options: v.options,
    price: Number(v.price),
    compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
    stock: Number(v.stock),
  }));
}

export async function createProductAction(_prevState: unknown, formData: FormData) {
  const { seller } = await requireSeller();

  const imagesRaw = String(formData.get("imagesJson") ?? "[]");
  const images = (JSON.parse(imagesRaw) as string[]).filter(Boolean).map((url) => ({ url }));
  const variants = parseVariants(formData);

  if (images.length === 0) return { error: "Add at least one product image URL." };
  if (variants.length === 0) return { error: "Add at least one variant with price and stock." };

  let productId: string;
  try {
    const product = await createProduct({
      sellerId: seller.id,
      categoryId: String(formData.get("categoryId")),
      brandId: String(formData.get("brandId") || "") || undefined,
      name: String(formData.get("name")).trim(),
      description: String(formData.get("description")).trim(),
      basePrice: Number(formData.get("basePrice")),
      compareAtPrice: formData.get("compareAtPrice") ? Number(formData.get("compareAtPrice")) : undefined,
      weightGrams: formData.get("weightGrams") ? Number(formData.get("weightGrams")) : undefined,
      warrantyInfo: String(formData.get("warrantyInfo") || "") || undefined,
      shippingInfo: String(formData.get("shippingInfo") || "") || undefined,
      images,
      variants,
    });
    productId = product.id;
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/products");
  redirect(`/products/${productId}`);
}

export async function updateProductDetailsAction(productId: string, patch: Parameters<typeof updateProduct>[2]) {
  const { seller } = await requireSeller();
  try {
    await updateProduct(productId, seller.id, patch);
    revalidatePath(`/products/${productId}`);
    revalidatePath("/products");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function deleteProductAction(productId: string) {
  const { seller } = await requireSeller();
  await deleteProduct(productId, seller.id);
  revalidatePath("/products");
  redirect("/products");
}

export async function addVariantAction(productId: string, variant: VariantInput) {
  const { seller } = await requireSeller();
  try {
    await addVariant(productId, seller.id, variant);
    revalidatePath(`/products/${productId}`);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function updateVariantAction(variantId: string, patch: { price?: number; compareAtPrice?: number | null; status?: "ACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED" }) {
  const { seller } = await requireSeller();
  try {
    await updateVariantPriceStock(variantId, seller.id, patch);
    revalidatePath("/products");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function restockVariantAction(variantId: string, quantity: number, note?: string) {
  const { seller } = await requireSeller();
  const variant = await db.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
  if (!variant || variant.product.sellerId !== seller.id) return { ok: false as const, error: "Not authorized" };
  try {
    await db.$transaction((tx) => restock(tx, variantId, seller.id, quantity, note));
    revalidatePath("/inventory");
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}
