"use client";

import { useEffect, useState } from "react";

function timeParts(msRemaining: number) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  return {
    h: String(Math.floor(total / 3600)).padStart(2, "0"),
    m: String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
    s: String(total % 60).padStart(2, "0"),
  };
}

// Renders "--:--:--" until mounted so SSR/client markup matches (Date.now()
// differs between server render time and hydration time otherwise).
export default function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(end - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (remaining === null) {
    return <span className="font-mono text-sm tabular-nums">--:--:--</span>;
  }

  if (remaining <= 0) {
    return <span className="text-sm font-medium">Ended</span>;
  }

  const { h, m, s } = timeParts(remaining);
  return (
    <span className="flex items-center gap-1 font-mono text-sm font-semibold tabular-nums">
      <span className="rounded bg-brand-ink px-1.5 py-0.5 text-white">{h}</span>:
      <span className="rounded bg-brand-ink px-1.5 py-0.5 text-white">{m}</span>:
      <span className="rounded bg-brand-ink px-1.5 py-0.5 text-white">{s}</span>
    </span>
  );
}
