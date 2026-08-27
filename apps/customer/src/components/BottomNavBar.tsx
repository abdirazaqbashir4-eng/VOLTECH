"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/categories", label: "Categories", icon: "grid_view" },
  { href: "/cart", label: "Cart", icon: "shopping_cart" },
  { href: "/account/orders", label: "Orders", icon: "package_2" },
  { href: "/account", label: "Account", icon: "person" },
] as const;

// BottomNavBar (Stitch JSON) — note Cart (not Search) is the 3rd tab in
// this design, with a live item-count badge. Rendered per-page (like
// <Header />/<TopAppBar /> already is) rather than in the root layout, so
// `cartCount` is always freshly fetched server-side by the calling page —
// the root layout isn't re-run on client-side navigations, so a cart
// count fetched there would go stale after an add-to-cart elsewhere.
export default function BottomNavBar({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center bg-surface px-2 py-1 h-16 border-t border-outline-variant md:hidden">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center hover:bg-surface-container-low transition-colors active:opacity-80 w-full h-full ${
              active ? "text-secondary font-bold" : "text-on-surface-variant"
            }`}
          >
            <div className="relative">
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.icon === "shopping_cart" && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-error text-on-error text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="font-label-lg text-label-sm mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
