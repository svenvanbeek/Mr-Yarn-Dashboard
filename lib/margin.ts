import {
  getOrders,
  getCostPriceMap,
  getBalanceTransactions,
  isExcludedCustomer,
  lineItemRevenueExclTax,
} from "./shopify";
import { getShipments } from "./myparcel";
import { getPeriodRange, type PeriodKey, type PeriodRange } from "./periods";

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

export interface DailyPoint {
  date: string;
  revenue: number;
  margin: number;
}

export interface CostBreakdownItem {
  label: string;
  value: number;
}

export interface PeriodTotals {
  revenue: number;
  margin: number;
  marginPct: number;
  orderCount: number;
}

export interface DashboardData {
  period: PeriodRange;
  orders: OrderMargin[];
  daily: DailyPoint[];
  costBreakdown: CostBreakdownItem[];
  totals: PeriodTotals;
  previousTotals: PeriodTotals;
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

function isWithin(dateIso: string, start: Date, end: Date): boolean {
  const t = new Date(dateIso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function emptyTotals(): PeriodTotals {
  return { revenue: 0, margin: 0, marginPct: 0, orderCount: 0 };
}

function buildOrderMargins(
  orders: any[],
  costMap: Record<number, number>,
  feesByOrderId: Record<number, number>,
  shippingByOrderName: Record<string, number>,
  packaging: number,
  fulfillment: number,
  marketingPerOrder: number,
  other: number
): OrderMargin[] {
  return orders.map((order: any) => {
    let revenue = 0;
    let cogs = 0;
    for (const item of order.line_items || []) {
      revenue += lineItemRevenueExclTax(order, item);
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
}

function totalsFromOrders(orders: OrderMargin[]): PeriodTotals {
  const revenue = orders.reduce((s, o) => s + o.revenue, 0);
  const margin = orders.reduce((s, o) => s + o.margin, 0);
  return {
    revenue: round2(revenue),
    margin: round2(margin),
    marginPct: revenue > 0 ? round1((margin / revenue) * 100) : 0,
    orderCount: orders.length,
  };
}

export async function computeDashboardData(periodKey: PeriodKey): Promise<DashboardData> {
  const period = getPeriodRange(periodKey);

  const [allOrders, costMap, allTransactions, allShipments] = await Promise.all([
    getOrders(period.previousStart),
    getCostPriceMap(),
    getBalanceTransactions(period.previousStart),
    getShipments(period.previousStart),
  ]);

  const included = allOrders.filter((o: any) => !isExcludedCustomer(o));
  const currentOrders = included.filter((o: any) => isWithin(o.created_at, period.currentStart, period.currentEnd));
  const previousOrders = included.filter((o: any) =>
    isWithin(o.created_at, period.previousStart, period.previousEnd)
  );

  const feesByOrderId: Record<number, number> = {};
  for (const t of allTransactions) {
    if (!t.source_order_id) continue;
    feesByOrderId[t.source_order_id] = (feesByOrderId[t.source_order_id] || 0) + Math.abs(parseFloat(t.fee) || 0);
  }

  const shippingByOrderName: Record<string, number> = {};
  for (const s of allShipments) {
    const ref = normalizeOrderName(s.reference_identifier);
    if (!ref) continue;
    const amount = s.price ? s.price.amount / 100 : 0;
    shippingByOrderName[ref] = (shippingByOrderName[ref] || 0) + amount;
  }

  const packaging = Number(process.env.COST_PACKAGING_PER_ORDER || 0);
  const fulfillment = Number(process.env.COST_FULFILLMENT_PER_ORDER || 0);
  const marketingTotal = Number(process.env.COST_MARKETING_TOTAL || 0);
  const other = Number(process.env.COST_OTHER_PER_ORDER || 0);
  const marketingPerOrder = currentOrders.length > 0 ? marketingTotal / currentOrders.length : 0;

  const orderMargins = buildOrderMargins(
    currentOrders, costMap, feesByOrderId, shippingByOrderName,
    packaging, fulfillment, marketingPerOrder, other
  );
  orderMargins.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const previousMarketingPerOrder = previousOrders.length > 0 ? marketingTotal / previousOrders.length : 0;
  const previousOrderMargins = buildOrderMargins(
    previousOrders, costMap, feesByOrderId, shippingByOrderName,
    packaging, fulfillment, previousMarketingPerOrder, other
  );

  const totals = orderMargins.length > 0 ? totalsFromOrders(orderMargins) : emptyTotals();
  const previousTotals = previousOrderMargins.length > 0 ? totalsFromOrders(previousOrderMargins) : emptyTotals();

  const dailyMap: Record<string, { revenue: number; margin: number }> = {};
  for (const o of orderMargins) {
    const day = o.date.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { revenue: 0, margin: 0 };
    dailyMap[day].revenue += o.revenue;
    dailyMap[day].margin += o.margin;
  }
  const daily: DailyPoint[] = Object.entries(dailyMap)
    .map(([date, v]) => ({ date, revenue: round2(v.revenue), margin: round2(v.margin) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const costBreakdown: CostBreakdownItem[] = [
    { label: "Kostprijs producten", value: round2(orderMargins.reduce((s, o) => s + o.cogs, 0)) },
    { label: "Transactiekosten", value: round2(orderMargins.reduce((s, o) => s + o.transactionFees, 0)) },
    { label: "Verzendkosten", value: round2(orderMargins.reduce((s, o) => s + o.shippingCost, 0)) },
    { label: "Verpakking", value: round2(orderMargins.reduce((s, o) => s + o.packaging, 0)) },
    { label: "Fulfilment", value: round2(orderMargins.reduce((s, o) => s + o.fulfillment, 0)) },
    { label: "Marketing", value: round2(orderMargins.reduce((s, o) => s + o.marketing, 0)) },
    { label: "Overig", value: round2(orderMargins.reduce((s, o) => s + o.other, 0)) },
  ].filter((item) => item.value > 0);

  return { period, orders: orderMargins, daily, costBreakdown, totals, previousTotals };
}
