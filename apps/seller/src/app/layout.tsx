import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], weight: ["400", "600", "700", "900"], variable: "--font-sans", display: "swap" });

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
    <html lang="en" className={`h-full antialiased ${sans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-background">{children}</body>
    </html>
  );
}
