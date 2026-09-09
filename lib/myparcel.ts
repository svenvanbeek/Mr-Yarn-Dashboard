// MyParcel API helper — haalt de werkelijk gefactureerde verzendkosten per
// zending op (Basic-authenticatie met base64-gecodeerde API-key).

const MYPARCEL_API_KEY = process.env.MYPARCEL_API_KEY!;
const REVALIDATE_SECONDS = 3600;

/**
 * Geeft een lege lijst terug bij een fout (bijv. ontbrekende/foute key), zodat
 * het dashboard blijft werken zonder verzendkosten in plaats van te crashen.
 */
export async function getShipments(daysBack: number): Promise<any[]> {
  if (!MYPARCEL_API_KEY) return [];

  const from = new Date(Date.now() - daysBack * 86_400_000).toISOString();
  const auth = Buffer.from(MYPARCEL_API_KEY).toString("base64");

  try {
    const res = await fetch(
      `https://api.myparcel.nl/shipments?size=200&from=${encodeURIComponent(from)}`,
      {
        headers: {
          Authorization: `basic ${auth}`,
          Accept: "application/json;charset=utf-8",
          "User-Agent": "MrYarnDashboard/1",
        },
        next: { revalidate: REVALIDATE_SECONDS },
      }
    );

    if (!res.ok) {
      throw new Error(`MyParcel API-fout (${res.status}): ${await res.text()}`);
    }

    const json = await res.json();
    return json?.data?.search_results?.shipments ?? json?.data?.shipments ?? [];
  } catch (err) {
    console.error("MyParcel-verzendkosten niet beschikbaar:", err);
    return [];
  }
}
