import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 text-sm sm:grid-cols-4 sm:px-6">
        <div>
          <h3 className="mb-3 font-semibold text-slate-900">Shop</h3>
          <ul className="space-y-2 text-slate-600">
            <li><Link href="/categories" className="hover:text-brand-teal">All categories</Link></li>
            <li><Link href="/search?sort=discount" className="hover:text-brand-teal">Deals</Link></li>
            <li><Link href="/search?sort=newest" className="hover:text-brand-teal">New arrivals</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-slate-900">Account</h3>
          <ul className="space-y-2 text-slate-600">
            <li><Link href="/account/orders" className="hover:text-brand-teal">Order history</Link></li>
            <li><Link href="/wishlist" className="hover:text-brand-teal">Wishlist</Link></li>
            <li><Link href="/account" className="hover:text-brand-teal">My account</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-slate-900">Sell on VOLTECH</h3>
          <ul className="space-y-2 text-slate-600">
            <li>
              <a href="http://localhost:3001/apply" className="hover:text-brand-teal">
                Become a seller
              </a>
            </li>
            <li>
              <a href="http://localhost:3001/login" className="hover:text-brand-teal">
                Seller Center
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-slate-900">VOLTECH</h3>
          <ul className="space-y-2 text-slate-600">
            <li><Link href="/about" className="hover:text-brand-teal">About us</Link></li>
            <li><Link href="/help" className="hover:text-brand-teal">Help center</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-slate-500 sm:px-6">
        © {new Date().getFullYear()} VOLTECH Marketplace. All rights reserved.
      </div>
    </footer>
  );
}
