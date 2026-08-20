"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="text-4xl" aria-hidden>⚠️</span>
      <h1 className="mt-4 text-lg font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        We couldn&apos;t load this page. This has been logged — try again, or head back to the homepage.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-brand-teal shadow-sm transition-colors px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-teal-dark"
        >
          Retry
        </button>
        <Link href="/" className="rounded-md border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-teal">
          Go home
        </Link>
      </div>
    </div>
  );
}
