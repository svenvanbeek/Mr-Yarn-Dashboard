import type { OrderMargin } from "@/lib/margin";

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(new Date(iso));
}

function marginClass(pct: number): "good" | "mid" | "bad" {
  if (pct < 0) return "bad";
  if (pct < 20) return "mid";
  return "good";
}

export default function MarginTable({ orders }: { orders: OrderMargin[] }) {
  if (orders.length === 0) {
    return (
      <div className="table-wrap">
        <p className="empty-state">Geen orders gevonden in deze periode.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Datum</th>
            <th>Omzet</th>
            <th>Kostprijs</th>
            <th>Transactie&shy;kosten</th>
            <th>Verzend&shy;kosten</th>
            <th>Verpakking</th>
            <th>Fulfilment</th>
            <th>Marketing</th>
            <th>Overig</th>
            <th>Marge €</th>
            <th className="sticky-col">Marge %</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const cls = marginClass(order.marginPct);
            return (
              <tr key={order.orderId} className={`margin-${cls}`}>
                <td className={order.missingCostPrice ? "order-name-warning" : undefined}>
                  {order.orderName}
                  {order.missingCostPrice && <span title="Kostprijs ontbreekt voor één of meer producten"> ⚠</span>}
                </td>
                <td>{formatDate(order.date)}</td>
                <td>{formatEuro(order.revenue)}</td>
                <td>{formatEuro(order.cogs)}</td>
                <td>{formatEuro(order.transactionFees)}</td>
                <td>{formatEuro(order.shippingCost)}</td>
                <td>{formatEuro(order.packaging)}</td>
                <td>{formatEuro(order.fulfillment)}</td>
                <td>{formatEuro(order.marketing)}</td>
                <td>{formatEuro(order.other)}</td>
                <td>{formatEuro(order.margin)}</td>
                <td className="sticky-col">
                  <span className={`margin-pct-badge ${cls}`}>{order.marginPct.toFixed(1)}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
