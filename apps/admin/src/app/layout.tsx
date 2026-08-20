import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

// Every page reads the admin session and live marketplace data — nothing
// here should be statically prerendered. Also keeps `next build` from
// needing a reachable, already-migrated database.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VOLTECH Admin",
  description: "VOLTECH marketplace administration.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${sans.variable} ${display.variable}`}>
      <body className="min-h-full flex flex-col bg-[var(--surface)] text-slate-900">{children}</body>
    </html>
  );
}
