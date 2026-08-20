import Link from "next/link";
import { SELLER_CENTER_URL } from "@/lib/links";

export default function Footer() {
  return (
    <footer className="mt-16 bg-[var(--brand-ink)] text-white/70">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-b border-white/[0.08] px-4 py-5 text-xs text-white/60 sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="flex items-center gap-1.5"><span aria-hidden className="text-brand-teal">✓</span> Verified sellers</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="text-brand-teal">✓</span> Secure payments</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="text-brand-teal">✓</span> Buyer protection</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="text-brand-teal">✓</span> Easy returns</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <span className="rounded-md border border-white/15 px-2 py-1 font-semibold">M-Pesa</span>
          <span className="rounded-md border border-white/15 px-2 py-1 font-semibold">Cards</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 text-sm sm:grid-cols-4 sm:px-6">
        <div>
          <h3 className="mb-3 font-display font-semibold text-white">Shop</h3>
          <ul className="space-y-2">
            <li><Link href="/categories" className="transition-colors hover:text-white">All categories</Link></li>
            <li><Link href="/search?sort=discount" className="transition-colors hover:text-white">Deals</Link></li>
            <li><Link href="/search?sort=newest" className="transition-colors hover:text-white">New arrivals</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-display font-semibold text-white">Account</h3>
          <ul className="space-y-2">
            <li><Link href="/account/orders" className="transition-colors hover:text-white">Order history</Link></li>
            <li><Link href="/wishlist" className="transition-colors hover:text-white">Wishlist</Link></li>
            <li><Link href="/account" className="transition-colors hover:text-white">My account</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-display font-semibold text-white">Sell on VOLTECH</h3>
          <ul className="space-y-2">
            <li>
              <a href={`${SELLER_CENTER_URL}/apply`} className="transition-colors hover:text-white">
                Become a seller
              </a>
            </li>
            <li>
              <a href={`${SELLER_CENTER_URL}/login`} className="transition-colors hover:text-white">
                Seller Center
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-display font-semibold text-white">VOLTECH</h3>
          <ul className="space-y-2">
            <li><Link href="/about" className="transition-colors hover:text-white">About us</Link></li>
            <li><Link href="/help" className="transition-colors hover:text-white">Help center</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.08] px-4 py-4 text-center text-xs text-white/40 sm:px-6">
        © {new Date().getFullYear()} VOLTECH Marketplace. All rights reserved.
      </div>
    </footer>
  );
}
