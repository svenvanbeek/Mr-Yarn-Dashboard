// Handmatige correcties (verzendkosten/kostprijs per order), opgeslagen in
// Vercel KV. Bewerkbaar via het instellingenscherm op /instellingen.

import { kv } from "@vercel/kv";
import { unstable_noStore as noStore } from "next/cache";

const KV_KEY = "order-overrides";

export interface OrderOverride {
  shippingCost?: number;
  cogs?: number;
  note?: string;
}

function normalizeOrderNumber(value: string | undefined | null): string {
  return (value || "").toString().replace("#", "").trim();
}

/**
 * Wordt aangeroepen vanuit lib/margin.ts. Geeft bij een fout een lege lijst
 * terug zodat het dashboard blijft werken zonder overrides.
 */
export async function getOrderOverrides(): Promise<Record<string, OrderOverride>> {
  // Voorkomt dat Next.js deze lees-aanroep cachet zoals een gewone fetch —
  // correcties moeten altijd meteen zichtbaar zijn, niet pas na een uur.
  noStore();
  try {
    const all = await kv.hgetall<Record<string, OrderOverride>>(KV_KEY);
    return all || {};
  } catch (err) {
    console.error("Kon overrides niet ophalen uit Vercel KV:", err);
    return {};
  }
}

/** Slaat een override op (of overschrijft een bestaande) voor één order. */
export async function saveOrderOverride(
  orderNumber: string,
  override: OrderOverride
): Promise<void> {
  const key = normalizeOrderNumber(orderNumber);
  if (!key) throw new Error("Ordernummer mag niet leeg zijn.");
  await kv.hset(KV_KEY, { [key]: override });
}

/** Verwijdert de override voor één order (orderdata zelf blijft ongemoeid). */
export async function deleteOrderOverride(orderNumber: string): Promise<void> {
  const key = normalizeOrderNumber(orderNumber);
  if (!key) return;
  await kv.hdel(KV_KEY, key);
}
