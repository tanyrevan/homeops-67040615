import { monthKey, monthSummary } from "@/lib/dashboard-stats";

export type HouseholdGrocery = { purchase_date: string; amount: number; reimbursed: boolean };
export type HouseholdVisit = { id: string; service_provider_id: string; visit_date: string; amount_paid: number | null; paid: boolean; next_service_date: string | null; created_at: string };
export type HouseholdProvider = { id: string; service_type: string };
const cents = (amount: number | null) => Math.round(Number(amount ?? 0) * 100);
const sum = <T,>(rows: T[], amount: (row: T) => number | null) => rows.reduce((total, row) => total + cents(amount(row)), 0) / 100;

export type SpendPeriod = "month" | "last3" | "all";

/** Total Spend for a period: groceries by purchase_date, visits by visit_date, settlement ignored. */
export function periodTotal(groceries: HouseholdGrocery[], visits: HouseholdVisit[], today: Date, period: SpendPeriod) {
  if (period === "all") return sum(groceries, (g) => g.amount) + sum(visits, (v) => v.amount_paid);
  const count = period === "month" ? 1 : 3;
  const keys = new Set(Array.from({ length: count }, (_, i) => monthKey(new Date(today.getFullYear(), today.getMonth() - i, 1))));
  return sum(groceries.filter((g) => keys.has(g.purchase_date.slice(0, 7))), (g) => g.amount)
    + sum(visits.filter((v) => keys.has(v.visit_date.slice(0, 7))), (v) => v.amount_paid);
}

/** Y-axis max for the stacked chart: at least $1,000, in $200 increments. */
export function chartAxisMax(highestMonthTotal: number) {
  return Math.max(1000, Math.ceil(highestMonthTotal / 200) * 200);
}

export function householdStats(groceries: HouseholdGrocery[], visits: HouseholdVisit[], providers: HouseholdProvider[], today: Date) {
  const types = new Map(providers.map((p) => [p.id, p.service_type]));
  // Saved provider types define account categories, including those without visits.
  const categories = [...new Set(providers.map((p) => p.service_type).filter((type) => type && type !== "Other"))].sort((a, b) => a.localeCompare(b));
  const currentKey = monthKey(today);
  const groceryMonth = sum(groceries.filter((g) => g.purchase_date.slice(0, 7) === currentKey), (g) => g.amount);
  const groceryDue = sum(groceries.filter((g) => g.reimbursed === false), (g) => g.amount);
  const rows = [
    // Groceries have no maintenance visits: Last Visit / Next Visit stay "—".
    { category: "Groceries", total: groceryMonth, due: groceryDue, lastVisit: null as string | null, nextVisit: null as string | null },
    ...categories.map((category) => {
      const records = visits.filter((v) => types.get(v.service_provider_id) === category);
      const latest = [...records].sort((a, b) => b.visit_date.localeCompare(a.visit_date) || b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))[0];
      return { category, total: sum(records.filter((v) => v.visit_date.slice(0, 7) === currentKey), (v) => v.amount_paid), due: sum(records.filter((v) => v.paid === false), (v) => v.amount_paid), lastVisit: latest?.visit_date ?? null, nextVisit: latest?.next_service_date ?? null };
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
  return { recorded: (cents(groceryTotal) + cents(sum(visits, (v) => v.amount_paid))) / 100, due: (cents(groceryDue) + cents(sum(visits.filter((v) => v.paid === false), (v) => v.amount_paid))) / 100, rows, chart, series };
}