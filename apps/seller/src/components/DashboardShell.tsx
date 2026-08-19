import Link from "next/link";
import { signOut } from "@/auth";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/notifications", label: "Notifications" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/inventory", label: "Inventory" },
  { href: "/finance", label: "Finance" },
  { href: "/finance/payouts", label: "Payouts" },
  { href: "/returns", label: "Returns" },
  { href: "/promotions", label: "Promotions" },
  { href: "/settings", label: "Store settings" },
];

export default function DashboardShell({ storeName, children }: { storeName: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <Link href="/dashboard" className="font-bold text-slate-900">VOLTECH</Link>
          <p className="truncate text-xs text-slate-500">{storeName}</p>
        </div>
        <nav className="space-y-0.5 p-2 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-md px-3 py-2 text-slate-700 hover:bg-[var(--surface)]">
              {l.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="border-t border-[var(--border)] p-2"
        >
          <button type="submit" className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 hover:bg-[var(--surface)]">
            Sign out
          </button>
        </form>
      </aside>
      <div className="flex-1 bg-[var(--surface)] p-6 sm:p-8">{children}</div>
    </div>
  );
}
