import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CompareBar from "@/components/CompareBar";
import QuickViewProvider from "@/contexts/QuickViewContext";

const sans = Inter({ subsets: ["latin"], weight: ["400", "600", "700", "900"], variable: "--font-sans", display: "swap" });

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
    <html lang="en" className={`h-full antialiased ${sans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-background">
        <QuickViewProvider>
          {children}
          <CompareBar />
        </QuickViewProvider>
      </body>
    </html>
  );
}
