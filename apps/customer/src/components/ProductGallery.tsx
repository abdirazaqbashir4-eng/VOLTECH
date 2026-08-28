"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images, name }: { images: { url: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const shown = images.length > 0 ? images : [{ url: "" }];

  return (
    <section className="relative bg-surface-container-lowest w-full aspect-[4/3] flex items-center justify-center border-b border-outline-variant overflow-hidden">
      {shown[active]?.url ? (
        <Image src={shown[active].url} alt={name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover p-4" priority />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-on-surface-variant">No image</div>
      )}
      {shown.length > 1 && (
        <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2">
          {shown.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full ${i === active ? "bg-secondary" : "bg-outline-variant"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
