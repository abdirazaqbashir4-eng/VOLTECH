"use server";

import { revalidatePath } from "next/cache";
import { db } from "@voltech/database";
import { requireAdmin } from "@/lib/session";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createCategoryAction(_prevState: unknown, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const slug = slugify(name);
  const exists = await db.category.findUnique({ where: { slug } });
  if (exists) return { error: "A category with this name already exists." };

  await db.category.create({
    data: {
      name,
      slug,
      description: String(formData.get("description") || "") || undefined,
      imageUrl: String(formData.get("imageUrl") || "") || undefined,
      parentId: String(formData.get("parentId") || "") || undefined,
      sortOrder: Number(formData.get("sortOrder") || 0),
    },
  });

  revalidatePath("/categories");
  return { error: null };
}

export async function toggleCategoryStatusAction(categoryId: string) {
  await requireAdmin();
  const cat = await db.category.findUniqueOrThrow({ where: { id: categoryId } });
  await db.category.update({ where: { id: categoryId }, data: { status: cat.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } });
  revalidatePath("/categories");
  return { ok: true as const };
}
