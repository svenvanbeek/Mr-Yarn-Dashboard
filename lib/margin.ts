import { getOrders, getCostPriceMap, getBalanceTransactions, isExcludedCustomer } from "./shopify";
import { getShipments } from "./myparcel";

export interface OrderMargin {
  orderId: number;
  orderName: string;
  date: string;
  revenue: number;
  cogs: number;
  transactionFees: number;
  shippingCost: number;
  packaging: number;
  fulfillment: number;
  marketing: number;
  other: number;
  margin: number;
  marginPct: number;
}

export interface DashboardData {
  periodDays: number;
  orders: OrderMargin[];
  totals: {
    revenue: number;
    margin: number;
    marginPct: number;
    orderCount: number;
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round1(n: number): number {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

function normalizeOrderName(name: string | undefined | null): string {
  return (name || "").replace("#", "").trim();
}

export async function computeDashboardData(periodDays: number): Promise<DashboardData> {
  const [orders, costMap, transactions, shipments] = await Promise.all([
    getOrders(periodDays),
    getCostPriceMap(),
    getBalanceTransactions(periodDays),
    getShipments(periodDays),
  ]);

  const includedOrders = orders.filter((o: any) => !isExcludedCustomer(o));

  const feesByOrderId: Record<number, number> = {};
  for (const t of transactions) {
    if (!t.source_order_id) continue;
    feesByOrderId[t.source_order_id] = (feesByOrderId[t.source_order_id] || 0) + Math.abs(parseFloat(t.fee) || 0);
  }

  const shippingByOrderName: Record<string, number> = {};
  for (const s of shipments) {
    const ref = normalizeOrderName(s.reference_identifier);
    if (!ref) continue;
    const amount = s.price ? s.price.amount / 100 : 0;
    shippingByOrderName[ref] = (shippingByOrderName[ref] || 0) + amount;
  }

  const packaging = Number(process.env.COST_PACKAGING_PER_ORDER || 0);
  const fulfillment = Number(process.env.COST_FULFILLMENT_PER_ORDER || 0);
  const marketingTotal = Number(process.env.COST_MARKETING_TOTAL || 0);
  const other = Number(process.env.COST_OTHER_PER_ORDER || 0);
  const marketingPerOrder = includedOrders.length > 0 ? marketingTotal / includedOrders.length : 0;

  const orderMargins: OrderMargin[] = includedOrders.map((order: any) => {
    let revenue = 0;
    let cogs = 0;
    for (const item of order.line_items || []) {
      revenue += (parseFloat(item.price) || 0) * item.quantity;
      cogs += (costMap[item.variant_id] || 0) * item.quantity;
    }

    const shippingCost = shippingByOrderName[normalizeOrderName(order.name)] || 0;
    const transactionFees = feesByOrderId[order.id] || 0;
    const totalCosts =
      cogs + transactionFees + shippingCost + packaging + fulfillment + marketingPerOrder + other;
    const margin = revenue - totalCosts;
    const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

    return {
      orderId: order.id,
      orderName: order.name,
      date: order.created_at,
      revenue: round2(revenue),
      cogs: round2(cogs),
      transactionFees: round2(transactionFees),
      shippingCost: round2(shippingCost),
      packaging: round2(packaging),
      fulfillment: round2(fulfillment),
      marketing: round2(marketingPerOrder),
      other: round2(other),
      margin: round2(margin),
      marginPct: round1(marginPct),
    };
  });

  orderMargins.sort((a, b) => a.marginPct - b.marginPct);

  const totalRevenue = orderMargins.reduce((sum, o) => sum + o.revenue, 0);
  const totalMargin = orderMargins.reduce((sum, o) => sum + o.margin, 0);

  return {
    periodDays,
    orders: orderMargins,
    totals: {
      revenue: round2(totalRevenue),
      margin: round2(totalMargin),
      marginPct: totalRevenue > 0 ? round1((totalMargin / totalRevenue) * 100) : 0,
      orderCount: orderMargins.length,
    },
  };
}
