export type PeriodKey = "mtd" | "lm" | "l365" | "this_quarter" | "last_quarter";

export interface PeriodRange {
  key: PeriodKey;
  label: string;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1);
}

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "mtd", label: "MTD" },
  { key: "lm", label: "Vorige maand" },
  { key: "l365", label: "Laatste 365 dagen" },
  { key: "this_quarter", label: "Dit kwartaal" },
  { key: "last_quarter", label: "Vorig kwartaal" },
];

/**
 * Geeft voor elke periode zowel de huidige als de vergelijkingsperiode terug.
 * Bij "lopende" periodes (mtd, dit kwartaal, laatste 365 dagen) loopt de
 * vergelijkingsperiode tot en met dezelfde relatieve dag — bijv. bij MTD op
 * 9 september vergelijk je met 1 t/m 9 augustus, niet de hele maand ervoor.
 */
export function getPeriodRange(key: PeriodKey, now: Date = new Date()): PeriodRange {
  const today = startOfDay(now);

  switch (key) {
    case "mtd": {
      const currentStart = startOfMonth(today);
      const currentEnd = endOfDay(today);
      const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      const previousEnd = new Date(
        prevMonthStart.getFullYear(),
        prevMonthStart.getMonth(),
        Math.min(today.getDate(), prevMonthLastDay),
        23, 59, 59, 999
      );
      return { key, label: "Maand tot nu toe", currentStart, currentEnd, previousStart: prevMonthStart, previousEnd };
    }
    case "lm": {
      const currentStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const currentEnd = endOfMonth(currentStart);
      const previousStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const previousEnd = endOfMonth(previousStart);
      return { key, label: "Vorige maand", currentStart, currentEnd, previousStart, previousEnd };
    }
    case "l365": {
      const currentStart = addDays(today, -364);
      const currentEnd = endOfDay(today);
      const previousStart = addDays(today, -729);
      const previousEnd = endOfDay(addDays(today, -365));
      return { key, label: "Laatste 365 dagen", currentStart, currentEnd, previousStart, previousEnd };
    }
    case "this_quarter": {
      const currentStart = startOfQuarter(today);
      const currentEnd = endOfDay(today);
      const dayIndex = Math.round((currentEnd.getTime() - currentStart.getTime()) / 86_400_000);
      const previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 3, 1);
      const previousEnd = endOfDay(addDays(previousStart, dayIndex));
      return { key, label: "Dit kwartaal", currentStart, currentEnd, previousStart, previousEnd };
    }
    case "last_quarter": {
      const thisQuarterStart = startOfQuarter(today);
      const currentStart = new Date(thisQuarterStart.getFullYear(), thisQuarterStart.getMonth() - 3, 1);
      const currentEnd = endOfDay(addDays(thisQuarterStart, -1));
      const previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 3, 1);
      const previousEnd = endOfDay(addDays(currentStart, -1));
      return { key, label: "Vorig kwartaal", currentStart, currentEnd, previousStart, previousEnd };
    }
  }
}
