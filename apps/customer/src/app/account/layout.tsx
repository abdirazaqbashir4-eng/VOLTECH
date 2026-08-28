import Link from "next/link";
import TopAppBar from "@/components/TopAppBar";
import BottomNavBar from "@/components/BottomNavBar";
import Footer from "@/components/Footer";
import { auth } from "@/auth";
import { getCartView } from "@voltech/core/marketplace/cart";

const LINKS = [
  { href: "/account", label: "Overview", icon: "person" },
  { href: "/account/orders", label: "Order history", icon: "package_2" },
  { href: "/account/addresses", label: "Addresses", icon: "location_on" },
  { href: "/account/notifications", label: "Notifications", icon: "notifications" },
  { href: "/account/settings", label: "Settings", icon: "settings" },
];

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const session = await auth();
  const cartCount = session?.user ? (await getCartView(session.user.id)).itemCount : 0;

  return (
    <>
      <TopAppBar variant="home" />
      <main className="flex-1 pb-24 md:flex md:max-w-6xl md:mx-auto md:w-full md:gap-stack-lg md:px-6 md:py-stack-lg">
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="space-y-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded px-3 py-2 font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-low">
                <span className="material-symbols-outlined text-[20px]">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </main>
      <Footer />
      <BottomNavBar cartCount={cartCount} />
    </>
  );
}
