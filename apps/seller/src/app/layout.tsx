import type { Metadata } from "next";
import "./globals.css";

// Every page reads the seller session and live store data — nothing here
// should be statically prerendered. Also keeps `next build` from needing a
// reachable, already-migrated database.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VOLTECH Seller Center",
  description: "Manage your VOLTECH store: products, orders, inventory and payouts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
