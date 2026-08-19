import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
