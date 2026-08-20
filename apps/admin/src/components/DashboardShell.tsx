import { signOut } from "@/auth";
import DashboardSidebar from "./DashboardSidebar";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/notifications", label: "Notifications" },
  { href: "/sellers", label: "Sellers" },
  { href: "/sellers/applications", label: "Seller applications" },
  { href: "/products", label: "Product moderation" },
  { href: "/categories", label: "Categories" },
  { href: "/orders", label: "Orders" },
  { href: "/commissions", label: "Commissions" },
  { href: "/payouts", label: "Payouts" },
  { href: "/promotions", label: "Promotions" },
  { href: "/reviews", label: "Reviews" },
  { href: "/returns", label: "Returns" },
  { href: "/admins", label: "Administrators" },
];

export default function DashboardShell({ name, children }: { name: string; children: React.ReactNode }) {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar name={name} links={LINKS} onSignOut={handleSignOut} />
      <div className="flex-1 bg-[var(--surface)] p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
