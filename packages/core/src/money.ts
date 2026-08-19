// All prices are stored as Float in KES major units (no cents subdivision in
// this market convention). Round consistently at every boundary so seller
// ledgers and order totals never drift by fractions of a cent.

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function percentOf(amount: number, pct: number): number {
  return round2((amount * pct) / 100);
}
