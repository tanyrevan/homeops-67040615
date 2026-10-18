import { monthKey, monthSummary } from "@/lib/dashboard-stats";

export type HouseholdGrocery = { purchase_date: string; amount: number; reimbursed: boolean };
export type HouseholdVisit = { id: string; service_provider_id: string; visit_date: string; amount_paid: number | null; paid: boolean; next_service_date: string | null; created_at: string };
export type HouseholdProvider = { id: string; service_type: string };
const cents = (amount: number | null) => Math.round(Number(amount ?? 0) * 100);
const sum = <T,>(rows: T[], amount: (row: T) => number | null) => rows.reduce((total, row) => total + cents(amount(row)), 0) / 100;

export function householdStats(groceries: HouseholdGrocery[], visits: HouseholdVisit[], providers: HouseholdProvider[], today: Date) {
  const types = new Map(providers.map((p) => [p.id, p.service_type]));
  // Saved provider types define account categories, including those without visits.
  const categories = [...new Set(providers.map((p) => p.service_type).filter((type) => type && type !== "Other"))].sort((a, b) => a.localeCompare(b));
  const groceryTotal = sum(groceries, (g) => g.amount);
  const groceryDue = sum(groceries.filter((g) => g.reimbursed === false), (g) => g.amount);
  const rows = [
    { category: "Groceries", total: groceryTotal, due: groceryDue, lastActivity: groceries.map((g) => g.purchase_date).sort().at(-1) ?? null, nextVisit: null as string | null },
    ...categories.map((category) => {
      const records = visits.filter((v) => types.get(v.service_provider_id) === category);
      const latest = [...records].sort((a, b) => b.visit_date.localeCompare(a.visit_date) || b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))[0];
      return { category, total: sum(records, (v) => v.amount_paid), due: sum(records.filter((v) => v.paid === false), (v) => v.amount_paid), lastActivity: latest?.visit_date ?? null, nextVisit: latest?.next_service_date ?? null };
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
    return { key, label: month.toLocaleDateString("en-US", { month: "short", year: "numeric" }), ...values };
  });
  return { recorded: (cents(groceryTotal) + cents(sum(visits, (v) => v.amount_paid))) / 100, due: (cents(groceryDue) + cents(sum(visits.filter((v) => v.paid === false), (v) => v.amount_paid))) / 100, rows, chart, series };
}