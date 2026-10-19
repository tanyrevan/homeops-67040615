import { monthKey, monthSummary } from "@/lib/dashboard-stats";
import { localISO } from "@/lib/due-status";
import { expenseTypeLabel } from "@/lib/expense-type";

export type HouseholdGrocery = { purchase_date: string; amount: number; reimbursed: boolean };
export type HouseholdVisit = { id: string; service_provider_id: string; visit_date: string; amount_paid: number | null; paid: boolean; created_at: string };
export type HouseholdProvider = { id: string; service_type: string };
const cents = (amount: number | null) => Math.round(Number(amount ?? 0) * 100);
const sum = <T,>(rows: T[], amount: (row: T) => number | null) => rows.reduce((total, row) => total + cents(amount(row)), 0) / 100;

export type SpendPeriod = "month" | "last3" | "all" | `year:${number}`;

/** Calendar years for the period dropdowns: current year plus years present in the data, newest first, never future. */
export function availableYears(groceries: HouseholdGrocery[], visits: HouseholdVisit[], today: Date): number[] {
  const years = new Set<number>([today.getFullYear()]);
  for (const g of groceries) years.add(Number(g.purchase_date.slice(0, 4)));
  for (const v of visits) years.add(Number(v.visit_date.slice(0, 4)));
  return [...years].filter((y) => y <= today.getFullYear()).sort((a, b) => b - a);
}

/** Total Spend for a period: groceries by purchase_date, visits by visit_date, settlement ignored. */
export function periodTotal(groceries: HouseholdGrocery[], visits: HouseholdVisit[], today: Date, period: SpendPeriod) {
  if (period === "all") return sum(groceries, (g) => g.amount) + sum(visits, (v) => v.amount_paid);
  if (period.startsWith("year:")) {
    const prefix = `${period.slice(5)}-`;
    return sum(groceries.filter((g) => g.purchase_date.startsWith(prefix)), (g) => g.amount)
      + sum(visits.filter((v) => v.visit_date.startsWith(prefix)), (v) => v.amount_paid);
  }
  const count = period === "month" ? 1 : 3;
  const keys = new Set(Array.from({ length: count }, (_, i) => monthKey(new Date(today.getFullYear(), today.getMonth() - i, 1))));
  return sum(groceries.filter((g) => keys.has(g.purchase_date.slice(0, 7))), (g) => g.amount)
    + sum(visits.filter((v) => keys.has(v.visit_date.slice(0, 7))), (v) => v.amount_paid);
}

/** Calendar months covered by a period, oldest to newest. */
export function periodMonths(period: SpendPeriod, today: Date, groceries: HouseholdGrocery[], visits: HouseholdVisit[]): Date[] {
  if (period === "month") return [new Date(today.getFullYear(), today.getMonth(), 1)];
  if (period === "last3") return Array.from({ length: 3 }, (_, i) => new Date(today.getFullYear(), today.getMonth() - 2 + i, 1));
  if (period.startsWith("year:")) {
    const y = Number(period.slice(5));
    return Array.from({ length: 12 }, (_, m) => new Date(y, m, 1));
  }
  const keys = new Set<string>([monthKey(today)]);
  for (const g of groceries) keys.add(g.purchase_date.slice(0, 7));
  for (const v of visits) keys.add(v.visit_date.slice(0, 7));
  return [...keys].sort().map((key) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1));
}

/** Stacked monthly chart data for an arbitrary set of months. */
export function spendingChart(groceries: HouseholdGrocery[], visits: HouseholdVisit[], providers: HouseholdProvider[], months: Date[]) {
  const types = new Map(providers.map((p) => [p.id, expenseTypeLabel(p.service_type)]));
  const categories = [...new Set(providers.map((p) => expenseTypeLabel(p.service_type)).filter((type) => type && type !== "Other"))].sort((a, b) => a.localeCompare(b));
  const keys = new Set(months.map(monthKey));
  const chartCategories = categories.filter((category) => visits.some((v) => types.get(v.service_provider_id) === category && keys.has(v.visit_date.slice(0, 7)) && cents(v.amount_paid) !== 0));
  const series = ["Groceries", ...chartCategories].map((name, i) => ({ name, key: `spend${i}` }));
  const chart = months.map((month) => {
    const key = monthKey(month);
    const values: Record<string, number> = { spend0: sum(groceries.filter((g) => g.purchase_date.slice(0, 7) === key), (g) => g.amount) };
    chartCategories.forEach((category, i) => {
      values[`spend${i + 1}`] = sum(visits.filter((v) => types.get(v.service_provider_id) === category && v.visit_date.slice(0, 7) === key), (v) => v.amount_paid);
    });
    return { key, label: month.toLocaleDateString("en-US", { month: "short", year: "numeric" }), spend0: values["spend0"] ?? 0, ...values };
  });
  return { chart, series };
}

/** Y-axis max for the stacked chart: at least $1,000, in $200 increments. */
export function chartAxisMax(highestMonthTotal: number) {
  return Math.max(1000, Math.ceil(highestMonthTotal / 200) * 200);
}

export function householdStats(groceries: HouseholdGrocery[], visits: HouseholdVisit[], providers: HouseholdProvider[], today: Date) {
  const types = new Map(providers.map((p) => [p.id, expenseTypeLabel(p.service_type)]));
  // Saved provider types define account categories, including those without visits.
  const categories = [...new Set(providers.map((p) => expenseTypeLabel(p.service_type)).filter((type) => type && type !== "Other"))].sort((a, b) => a.localeCompare(b));
  const currentKey = monthKey(today);
  const groceryMonth = sum(groceries.filter((g) => g.purchase_date.slice(0, 7) === currentKey), (g) => g.amount);
  const groceryDue = sum(groceries.filter((g) => g.reimbursed === false), (g) => g.amount);
  const rows = [
    // Groceries have no maintenance visits: Last Visit / Next Visit stay "—".
    { category: "Groceries", total: groceryMonth, due: groceryDue, lastVisit: null as string | null, nextVisit: null as string | null },
    ...categories.map((category) => {
      const records = visits.filter((v) => types.get(v.service_provider_id) === category);
      // Scheduling comes from visit_date itself: Last Visit = latest past/today
      // visit, Next Visit = earliest future visit. next_service_date is unused.
      const todayStr = localISO(today);
      const past = records.filter((v) => v.visit_date <= todayStr);
      const future = records.filter((v) => v.visit_date > todayStr);
      const latest = [...past].sort((a, b) => b.visit_date.localeCompare(a.visit_date) || b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))[0];
      const next = [...future].sort((a, b) => a.visit_date.localeCompare(b.visit_date) || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))[0];
      return { category, total: sum(records.filter((v) => v.visit_date.slice(0, 7) === currentKey), (v) => v.amount_paid), due: sum(records.filter((v) => v.paid === false), (v) => v.amount_paid), lastVisit: latest?.visit_date ?? null, nextVisit: next?.visit_date ?? null };
    }),
  ];
  const months = Array.from({ length: 3 }, (_, i) => new Date(today.getFullYear(), today.getMonth() - 2 + i, 1));
  const keys = new Set(months.map(monthKey));
  const chartCategories = categories.filter((category) => visits.some((v) => types.get(v.service_provider_id) === category && keys.has(v.visit_date.slice(0, 7)) && cents(v.amount_paid) !== 0));
  const series = ["Groceries", ...chartCategories].map((name, i) => ({ name, key: `spend${i}` }));
  const chart = months.map((month) => {
    const key = monthKey(month);
    const values: Record<string, number> = { spend0: monthSummary(groceries, [], month).groceryTotal };
    chartCategories.forEach((category, i) => {
      values[`spend${i + 1}`] = sum(visits.filter((v) => types.get(v.service_provider_id) === category && v.visit_date.slice(0, 7) === key), (v) => v.amount_paid);
    });
    return { key, label: month.toLocaleDateString("en-US", { month: "short", year: "numeric" }), spend0: values["spend0"] ?? 0, ...values };
  });
  return { recorded: (cents(sum(groceries, (g) => g.amount)) + cents(sum(visits, (v) => v.amount_paid))) / 100, due: (cents(groceryDue) + cents(sum(visits.filter((v) => v.paid === false), (v) => v.amount_paid))) / 100, rows, chart, series };
}