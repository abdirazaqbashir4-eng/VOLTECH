"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCompareIds, clearCompare, onCompareChange } from "@/lib/compareStore";

export default function CompareBar() {
  const [count, setCount] = useState(0);

  // Deliberately not a lazy initializer: localStorage is unavailable during
  // SSR, so the initial state must match the server's (0/hidden) to avoid a
  // hydration mismatch — the real count is only readable client-side, which
  // is exactly what an effect is for.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCount(getCompareIds().length);
    return onCompareChange(() => setCount(getCompareIds().length));
  }, []);

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-14 z-30 flex justify-center px-4 md:bottom-4">
      <div className="flex items-center gap-4 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 shadow-lg">
        <span className="text-sm font-medium text-slate-800">{count} item{count === 1 ? "" : "s"} to compare</span>
        <Link href="/compare" className="rounded-full bg-brand-teal px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-teal-dark">
          Compare
        </Link>
        <button type="button" onClick={clearCompare} className="text-sm text-slate-400 hover:text-red-600">
          Clear
        </button>
      </div>
    </div>
  );
}
