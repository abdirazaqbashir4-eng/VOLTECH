"use client";

import { createContext, useContext, useState, useCallback } from "react";
import QuickViewModal from "@/components/QuickViewModal";

interface QuickViewContextValue {
  openQuickView: (slug: string) => void;
}

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

export function useQuickView() {
  const ctx = useContext(QuickViewContext);
  if (!ctx) throw new Error("useQuickView must be used within QuickViewProvider");
  return ctx;
}

export default function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);

  const openQuickView = useCallback((s: string) => setSlug(s), []);
  const close = useCallback(() => setSlug(null), []);

  return (
    <QuickViewContext.Provider value={{ openQuickView }}>
      {children}
      {slug && <QuickViewModal slug={slug} onClose={close} />}
    </QuickViewContext.Provider>
  );
}
