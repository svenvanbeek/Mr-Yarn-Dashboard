// Shopify Admin API helpers.
// Gebruikt dezelfde client credentials grant als het Google Sheets-script:
// geen vast token, maar Client ID + Client secret die zelf een tijdelijk
// token ophalen. Alle GET-calls cachen 1 uur (revalidate: 3600) — dat is
// de "elk uur bijgewerkt"-laag, zonder dat er een aparte cron-job nodig is.

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP!;
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const API_VERSION = "2024-10";
const REVALIDATE_SECONDS = 3600;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`https://${SHOPIFY_SHOP}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Kon geen Shopify-token ophalen (${res.status}): ${await res.text()}`);
  }

  const json = await res.json();
  cachedToken = { token: json.access_token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  return cachedToken.token;
}

async function shopifyFetch(path: string): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(`https://${SHOPIFY_SHOP}/admin/api/${API_VERSION}/${path}`, {
    headers: { "X-Shopify-Access-Token": token },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Shopify API-fout (${res.status}) bij ${path}: ${await res.text()}`);
  }
  return res;
}

async function shopifyGetAll(path: string, rootKey: string): Promise<any[]> {
  let results: any[] = [];
  let nextPath: string | null = path;
  let guard = 0;

  while (nextPath && guard < 100) {
    guard++;
    const res = await shopifyFetch(nextPath);
    const json = await res.json();
    results = results.concat(json[rootKey] || []);

    const link = res.headers.get("link");
    nextPath = null;
    if (link) {
      const match = link.match(/<([^>]+)>;\s*rel="next"/);
      if (match) {
        nextPath = match[1].split(`/admin/api/${API_VERSION}/`)[1] ?? null;
      }
    }
  }

  return results;
}

export async function getOrders(since: Date): Promise<any[]> {
  return shopifyGetAll(
    `orders.json?status=any&limit=250&created_at_min=${encodeURIComponent(since.toISOString())}`,
    "orders"
  );
}

export async function getCostPriceMap(): Promise<Record<number, number>> {
  const products = await shopifyGetAll("products.json?limit=250&fields=id,variants", "products");

  const variantToInventoryItem: Record<number, number> = {};
  const inventoryItemIds: number[] = [];
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      variantToInventoryItem[variant.id] = variant.inventory_item_id;
      inventoryItemIds.push(variant.inventory_item_id);
    }
  }

  const costPerInventoryItem: Record<number, number> = {};
  const BATCH_SIZE = 50;
  for (let i = 0; i < inventoryItemIds.length; i += BATCH_SIZE) {
    const batch = inventoryItemIds.slice(i, i + BATCH_SIZE);
    const items = await shopifyGetAll(`inventory_items.json?ids=${batch.join(",")}`, "inventory_items");
    for (const item of items) {
      costPerInventoryItem[item.id] = parseFloat(item.cost) || 0;
    }
  }

  const costPerVariant: Record<number, number> = {};
  for (const [variantId, invId] of Object.entries(variantToInventoryItem)) {
    costPerVariant[Number(variantId)] = costPerInventoryItem[invId] || 0;
  }
  return costPerVariant;
}

export async function getBalanceTransactions(since: Date): Promise<any[]> {
  try {
    const all = await shopifyGetAll("shopify_payments/balance/transactions.json", "transactions");
    const sinceMs = since.getTime();
    return all.filter((t: any) => !t.processed_at || new Date(t.processed_at).getTime() >= sinceMs);
  } catch (err) {
    console.error("Shopify Payments-transacties niet beschikbaar:", err);
    return [];
  }
}

export function lineItemRevenueExclTax(order: any, item: any): number {
  const gross = (parseFloat(item.price) || 0) * item.quantity;
  if (!order.taxes_included) return gross;
  const taxAmount = (item.tax_lines || []).reduce(
    (sum: number, t: any) => sum + (parseFloat(t.price) || 0),
    0
  );
  return gross - taxAmount;
}

const EXCLUDED_NAMES = (process.env.EXCLUDED_CUSTOMER_NAMES || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isExcludedCustomer(order: any): boolean {
  if (!order.customer) return false;
  const name = `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim().toLowerCase();
  return EXCLUDED_NAMES.includes(name);
}
