const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "YYYY-MM" for a local date. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const cents = (n: number | null | undefined) => Math.round(Number(n ?? 0) * 100);

export function monthSummary(
  groceries: { purchase_date: string; amount: number }[],
  visits: { visit_date: string; amount_paid: number | null }[],
  today: Date,
) {
  const key = monthKey(today);
  const g = groceries; // TEMPORARILY BROKEN for red-test evidence: includes all months
  const v = visits.filter((x) => x.visit_date.slice(0, 7) === key);
  return {
    groceryTotal: g.reduce((s, x) => s + cents(x.amount), 0) / 100,
    maintenanceTotal: v.reduce((s, x) => s + cents(x.amount_paid), 0) / 100,
    visitCount: v.length,
  };
}

/** Last `n` calendar months ending with today's month, zero-filled. */
export function groceryByMonth(groceries: { purchase_date: string; amount: number }[], today: Date, n = 6) {
  const months: { key: string; label: string; total: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ key: monthKey(d), label: MONTHS[d.getMonth()] ?? "", total: 0 });
  }
  const idx = new Map(months.map((m, i) => [m.key, i]));
  const sums = months.map(() => 0);
  for (const g of groceries) {
    const i = idx.get(g.purchase_date.slice(0, 7));
    if (i !== undefined) sums[i] = (sums[i] ?? 0) + cents(g.amount);
  }
  return months.map((m, i) => ({ ...m, total: (sums[i] ?? 0) / 100 }));
}

export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
