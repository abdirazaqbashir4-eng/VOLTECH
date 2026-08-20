"use client";

import { useActionState, useState } from "react";
import { createProductAction } from "@/app/actions/products";
import FileUploadField from "./FileUploadField";

interface VariantRow {
  id: string;
  options: { key: string; value: string }[];
  price: string;
  compareAtPrice: string;
  stock: string;
}

function newVariantRow(): VariantRow {
  return { id: crypto.randomUUID(), options: [{ key: "", value: "" }], price: "", compareAtPrice: "", stock: "" };
}

export default function ProductForm({ categories, brands }: { categories: { id: string; name: string }[]; brands: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createProductAction, { error: null as string | null });
  const [images, setImages] = useState<string[]>([""]);
  const [variants, setVariants] = useState<VariantRow[]>([newVariantRow()]);

  const variantsJson = JSON.stringify(
    variants.map((v) => ({
      options: Object.fromEntries(v.options.filter((o) => o.key.trim()).map((o) => [o.key.trim(), o.value.trim()])),
      price: Number(v.price || 0),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
      stock: Number(v.stock || 0),
    })),
  );
  const imagesJson = JSON.stringify(images.filter(Boolean));

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <input type="hidden" name="variantsJson" value={variantsJson} />
      <input type="hidden" name="imagesJson" value={imagesJson} />

      <section className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="font-semibold text-slate-900">Basic information</h2>
        <input name="name" placeholder="Product name" required className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
        <textarea name="description" placeholder="Description" required rows={4} className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <select name="categoryId" required className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm">
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="brandId" className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm">
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="font-semibold text-slate-900">Pricing &amp; shipping</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="basePrice" type="number" step="0.01" placeholder="Base price (KES)" required className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
          <input name="compareAtPrice" type="number" step="0.01" placeholder="Compare-at price (optional)" className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
          <input name="weightGrams" type="number" placeholder="Weight (grams)" className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
          <input name="warrantyInfo" placeholder="Warranty info" className="rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
        </div>
        <input name="shippingInfo" placeholder="Shipping info (e.g. Ships within 2 days)" className="w-full rounded-lg border border-[var(--border)] px-3.5 py-2.5 outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 text-sm" />
      </section>

      <section className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="font-semibold text-slate-900">Images</h2>
        {images.map((url, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <FileUploadField
                folder="product-images"
                value={url}
                onChange={(newUrl) => setImages((prev) => prev.map((u, idx) => (idx === i ? newUrl : u)))}
                label={`Upload image ${i + 1}`}
              />
            </div>
            {images.length > 1 && (
              <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} className="mt-2 text-slate-400 hover:text-red-600">
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setImages((prev) => [...prev, ""])} className="text-sm text-brand-teal hover:underline">
          + Add another image
        </button>
      </section>

      <section className="space-y-4 rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="font-semibold text-slate-900">Variants</h2>
        <p className="text-xs text-slate-500">Add one row per SKU. Use option name/value pairs like Color / Black, or Storage / 256GB.</p>
        {variants.map((v, vi) => (
          <div key={v.id} className="space-y-2 rounded-md border border-[var(--border)] p-3">
            {v.options.map((opt, oi) => (
              <div key={oi} className="flex gap-2">
                <input
                  value={opt.key}
                  onChange={(e) =>
                    setVariants((prev) => prev.map((row, ri) => (ri === vi ? { ...row, options: row.options.map((o, i) => (i === oi ? { ...o, key: e.target.value } : o)) } : row)))
                  }
                  placeholder="Option (e.g. Color)"
                  className="w-1/3 rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
                />
                <input
                  value={opt.value}
                  onChange={(e) =>
                    setVariants((prev) => prev.map((row, ri) => (ri === vi ? { ...row, options: row.options.map((o, i) => (i === oi ? { ...o, value: e.target.value } : o)) } : row)))
                  }
                  placeholder="Value (e.g. Black)"
                  className="flex-1 rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setVariants((prev) => prev.map((row, ri) => (ri === vi ? { ...row, options: [...row.options, { key: "", value: "" }] } : row)))}
              className="text-xs text-brand-teal hover:underline"
            >
              + Add option
            </button>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={v.price}
                onChange={(e) => setVariants((prev) => prev.map((row, ri) => (ri === vi ? { ...row, price: e.target.value } : row)))}
                type="number"
                step="0.01"
                placeholder="Price"
                required
                className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
              />
              <input
                value={v.compareAtPrice}
                onChange={(e) => setVariants((prev) => prev.map((row, ri) => (ri === vi ? { ...row, compareAtPrice: e.target.value } : row)))}
                type="number"
                step="0.01"
                placeholder="Compare-at"
                className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
              />
              <input
                value={v.stock}
                onChange={(e) => setVariants((prev) => prev.map((row, ri) => (ri === vi ? { ...row, stock: e.target.value } : row)))}
                type="number"
                placeholder="Stock qty"
                required
                className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
              />
            </div>
            {variants.length > 1 && (
              <button type="button" onClick={() => setVariants((prev) => prev.filter((row) => row.id !== v.id))} className="text-xs text-red-600 hover:underline">
                Remove variant
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setVariants((prev) => [...prev, newVariantRow()])} className="text-sm text-brand-teal hover:underline">
          + Add another variant
        </button>
      </section>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="rounded-lg bg-brand-teal shadow-sm transition-colors px-6 py-2.5 font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-50">
        {isPending ? "Submitting..." : "Submit for approval"}
      </button>
    </form>
  );
}
