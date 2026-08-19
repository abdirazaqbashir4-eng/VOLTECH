// The seller center is a separate deployment (apps/seller), so links to it
// are plain <a> tags, not <Link>, and need an absolute URL. NEXT_PUBLIC_*
// so it's readable client-side too (ProductPurchasePanel etc. run client-side).
export const SELLER_CENTER_URL = process.env.NEXT_PUBLIC_SELLER_URL ?? "http://localhost:3001";
