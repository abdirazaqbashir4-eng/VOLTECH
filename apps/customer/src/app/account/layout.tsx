import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Order history" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/notifications", label: "Notifications" },
];

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full shrink-0 md:w-48">
            <nav className="space-y-1 text-sm">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-md px-3 py-2 text-slate-700 hover:bg-[var(--surface)]">
                  {l.label}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="flex-1">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
