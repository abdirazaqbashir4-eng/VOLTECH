import { randomBytes } from "crypto";

function randomDigits(len: number): string {
  let out = "";
  const bytes = randomBytes(len);
  for (let i = 0; i < len; i++) out += (bytes[i] % 10).toString();
  return out;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `VT${y}${m}${d}-${randomDigits(6)}`;
}

export function generateSellerOrderNumber(orderNumber: string, index: number): string {
  return `${orderNumber}-S${index + 1}`;
}

export function generateTransactionId(): string {
  return `TXN-${Date.now().toString(36).toUpperCase()}-${randomDigits(6)}`;
}

export function generatePayoutReference(): string {
  return `PO-${Date.now().toString(36).toUpperCase()}-${randomDigits(6)}`;
}

export function generateSku(prefix: string): string {
  return `${prefix}-${randomDigits(8)}`;
}
