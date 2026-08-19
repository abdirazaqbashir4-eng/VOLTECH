"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images, name }: { images: { url: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const shown = images.length > 0 ? images : [{ url: "" }];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--border)] bg-slate-100">
        {shown[active]?.url ? (
          <Image src={shown[active].url} alt={name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" priority />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No image</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border ${i === active ? "border-brand-teal" : "border-[var(--border)]"}`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
