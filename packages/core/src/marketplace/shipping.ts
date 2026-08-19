import { db } from "@voltech/database";

/**
 * Resolve a delivery estimate for an address. Matches the customer's county
 * against configured ShippingZones; falls back to the first zone flagged
 * "Nationwide" (or the first active zone at all) so checkout never hard-
 * blocks because a county wasn't explicitly configured. This keeps
 * zone/fee logic entirely database-driven and swappable for a real courier
 * integration later without touching checkout code.
 */
export async function resolveShippingMethods(county: string) {
  const zones = await db.shippingZone.findMany({ include: { methods: { where: { active: true } } } });

  const matched = zones.find((z) => {
    const counties = JSON.parse(z.countiesJson) as string[];
    return counties.some((c) => c.toLowerCase() === county.toLowerCase());
  });

  const nationwide = zones.find((z) => {
    const counties = JSON.parse(z.countiesJson) as string[];
    return counties.some((c) => c.toLowerCase() === "nationwide");
  });

  const zone = matched ?? nationwide ?? zones[0];
  return zone?.methods ?? [];
}
