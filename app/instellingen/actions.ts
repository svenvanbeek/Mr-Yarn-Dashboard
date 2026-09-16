"use server";

import { revalidatePath } from "next/cache";
import { saveOrderOverride, deleteOrderOverride } from "@/lib/overrides";

export async function saveOverrideAction(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") || "").trim();
  const shippingRaw = String(formData.get("shippingCost") || "").trim();
  const cogsRaw = String(formData.get("cogs") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!orderNumber) {
    throw new Error("Ordernummer is verplicht.");
  }

  const override: { shippingCost?: number; cogs?: number; note?: string } = {};
  if (shippingRaw !== "") {
    const value = Number(shippingRaw.replace(",", "."));
    if (Number.isFinite(value)) override.shippingCost = value;
  }
  if (cogsRaw !== "") {
    const value = Number(cogsRaw.replace(",", "."));
    if (Number.isFinite(value)) override.cogs = value;
  }
  if (note) override.note = note;

  await saveOrderOverride(orderNumber, override);

  // Zorgt dat het dashboard (dat 1 uur cachet) meteen de nieuwe waarde toont,
  // in plaats van te wachten tot de cache vanzelf verloopt.
  revalidatePath("/");
  revalidatePath("/instellingen");
}

export async function deleteOverrideAction(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") || "").trim();
  if (!orderNumber) return;

  await deleteOrderOverride(orderNumber);

  revalidatePath("/");
  revalidatePath("/instellingen");
}
