import Link from "next/link";
import { getOrderOverrides } from "@/lib/overrides";
import { saveOverrideAction, deleteOverrideAction } from "./actions";

function formatEuro(value: number | undefined): string {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
}

export const revalidate = 0; // altijd verse data tonen op deze pagina zelf

export default async function InstellingenPage() {
  const overrides = await getOrderOverrides();
  const rows = Object.entries(overrides).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">Instellingen</div>
          <h1 className="dashboard-title">Handmatige correcties per order</h1>
        </div>
        <Link href="/" className="period-btn">
          ← Terug naar dashboard
        </Link>
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-card-header">
          <h2 className="chart-title">Correctie toevoegen of bijwerken</h2>
        </div>
        <form
          action={saveOverrideAction}
          style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", padding: "12px 0" }}
        >
          <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Ordernummer</label>
            <input name="orderNumber" placeholder="24001496" required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Verzendkosten (€)</label>
            <input name="shippingCost" placeholder="bijv. 6,07" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Kostprijs (€)</label>
            <input name="cogs" placeholder="bijv. 5,20" style={inputStyle} />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Notitie (optioneel)</label>
            <input name="note" placeholder="custom order, geen variant" style={{ ...inputStyle, width: "100%" }} />
          </div>
          <button type="submit" className="period-btn active" style={{ cursor: "pointer" }}>
            Opslaan
          </button>
        </form>
        <p style={{ fontSize: 12, color: "#8A8676", paddingBottom: 12 }}>
          Laat Verzendkosten of Kostprijs leeg om dat veld niet te overschrijven. Vul je een
          ordernummer in dat al een correctie heeft, dan wordt die bijgewerkt.
        </p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Verzendkosten (override)</th>
              <th>Kostprijs (override)</th>
              <th>Notitie</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  Nog geen correcties toegevoegd.
                </td>
              </tr>
            ) : (
              rows.map(([orderNumber, override]) => (
                <tr key={orderNumber}>
                  <td>#{orderNumber}</td>
                  <td>{formatEuro(override.shippingCost)}</td>
                  <td>{formatEuro(override.cogs)}</td>
                  <td>{override.note || "—"}</td>
                  <td>
                    <form action={deleteOverrideAction}>
                      <input type="hidden" name="orderNumber" value={orderNumber} />
                      <button type="submit" className="period-btn" style={{ cursor: "pointer" }}>
                        Verwijderen
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #dad6c9",
  borderRadius: 2,
  padding: "8px 10px",
  fontSize: 13.5,
  minWidth: 140,
};
