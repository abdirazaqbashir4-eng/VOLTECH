"use client";

const KEY = "voltech-compare-ids";
const MAX_COMPARE = 4;
const CHANGE_EVENT = "voltech-compare-change";

export function getCompareIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function isInCompare(productId: string): boolean {
  return getCompareIds().includes(productId);
}

/** Returns false (and leaves the list unchanged) if already at MAX_COMPARE. */
export function toggleCompare(productId: string): boolean {
  const ids = getCompareIds();
  if (ids.includes(productId)) {
    write(ids.filter((id) => id !== productId));
    return true;
  }
  if (ids.length >= MAX_COMPARE) return false;
  write([...ids, productId]);
  return true;
}

export function removeFromCompare(productId: string) {
  write(getCompareIds().filter((id) => id !== productId));
}

export function clearCompare() {
  write([]);
}

export function onCompareChange(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export { MAX_COMPARE };
