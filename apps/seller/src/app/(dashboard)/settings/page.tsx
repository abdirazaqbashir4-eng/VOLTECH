import type { Metadata } from "next";
import { requireSeller } from "@/lib/session";
import StoreSettingsForm from "@/components/StoreSettingsForm";

export const metadata: Metadata = { title: "Store settings" };

export default async function SettingsPage() {
  const { seller } = await requireSeller();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Store settings</h1>
      <p className="mb-4 text-sm text-slate-500">Store: {seller.storeName} ({seller.storeSlug})</p>
      <StoreSettingsForm storeDescription={seller.storeDescription} logoUrl={seller.logoUrl} bannerUrl={seller.bannerUrl} />
    </div>
  );
}
