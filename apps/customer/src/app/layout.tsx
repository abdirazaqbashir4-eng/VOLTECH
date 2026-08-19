import type { Metadata } from "next";
import "./globals.css";
import MobileBottomNavClient from "@/components/MobileBottomNavClient";

// Every page here reads the session (via Header/account/proxy) and live
// marketplace data (stock, pricing, promotions) — none of it should be
// baked into a static build artifact. This also means `next build` never
// needs a reachable database, only `next start` at request time does.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "VOLTECH Marketplace — Shop electronics, fashion & more",
    template: "%s | VOLTECH",
  },
  description: "VOLTECH is a multi-vendor marketplace for electronics, fashion, home goods and more, with fast delivery across Kenya.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-[var(--foreground)] pb-14 md:pb-0">
        {children}
        <MobileBottomNavClient />
      </body>
    </html>
  );
}
