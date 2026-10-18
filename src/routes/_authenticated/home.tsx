import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { monthKey, usd } from "@/lib/dashboard-stats";
import { chartAxisMax, householdStats, periodTotal, type SpendPeriod } from "@/lib/household-stats";
import { filterOwnedRecords } from "@/lib/ownership";
import { localISO } from "@/lib/due-status";

// Paginate so the all-time totals aren't truncated by the backend row limit.
async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const result = await page(from, from + 999);
    if (result.error) throw new Error(result.error.message);
    rows.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < 1000) return rows;
  }
}
const dashboardQuery = (userId: string) => queryOptions({
  queryKey: ["dashboard", userId, monthKey(new Date())],
  queryFn: async () => {
    const [groceries, visits, providers] = await Promise.all([
      allRows((from, to) => supabase.from("grocery_expenses").select("user_id, purchase_date, amount, reimbursed").eq("user_id", userId).order("id").range(from, to)),
      allRows((from, to) => supabase.from("maintenance_visits").select("id, user_id, service_provider_id, visit_date, amount_paid, paid, next_service_date, created_at").eq("user_id", userId).order("id").range(from, to)),
      allRows((from, to) => supabase.from("service_providers").select("id, user_id, service_type").eq("user_id", userId).order("id").range(from, to)),
    ]);
    return { groceries: filterOwnedRecords(groceries, userId), visits: filterOwnedRecords(visits, userId), providers: filterOwnedRecords(providers, userId) };
  },
});
export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [
    { title: "Dashboard — HomeOps" },
    { name: "description", content: "Household spending, outstanding amounts, and maintenance activity." },
    { property: "og:title", content: "Dashboard — HomeOps" },
    { property: "og:description", content: "Household spending, outstanding amounts, and maintenance activity." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery(context.user.id)),
  pendingComponent: () => <AppShell><h1 className="text-2xl font-semibold">Dashboard</h1><p className="mt-4 text-muted-foreground">Loading…</p></AppShell>,
  errorComponent: () => <AppShell><h1 className="text-2xl font-semibold">Dashboard</h1><p className="mt-4 text-destructive">We couldn't load your dashboard. Please refresh.</p></AppShell>,
  component: Dashboard,
});
const dateLabel = (date: string | null) => date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const chartColors = ["var(--chart-2)", "var(--chart-1)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--chart-7)", "var(--chart-8)"];
const periodOptions: { value: SpendPeriod; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "last3", label: "Last 3 Months" },
  { value: "all", label: "Since Inception" },
];
function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data } = useSuspenseQuery(dashboardQuery(user.id));
  const today = new Date();
  const monthAbbr = today.toLocaleDateString("en-US", { month: "short" });
  const [period, setPeriod] = useState<SpendPeriod>("month");
  const stats = householdStats(data.groceries, data.visits, data.providers, today);
  const totalSpend = periodTotal(data.groceries, data.visits, today, period);
  const hasSpending = stats.chart.some((month) => stats.series.some((s) => Number(month[s.key as keyof typeof month]) > 0));
  const highestMonth = Math.max(0, ...stats.chart.map((month) => stats.series.reduce((total, s) => total + Number(month[s.key as keyof typeof month] ?? 0), 0)));
  const yMax = chartAxisMax(highestMonth);
  const yTicks = Array.from({ length: yMax / 200 + 1 }, (_, i) => i * 200);
  return <AppShell>
    <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
    <div className="mt-6 grid grid-cols-1 gap-5 border-b border-border pb-6 sm:grid-cols-2">
      <div>
        <div className="flex flex-wrap items-center gap-x-3">
          <h2 className="text-sm text-muted-foreground">Total Spend</h2>
          <select aria-label="Total Spend period" value={period} onChange={(e) => setPeriod(e.target.value as SpendPeriod)} className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground">
            {periodOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{usd(totalSpend)}</p>
      </div>
      <div><div className="flex flex-wrap items-center gap-x-3"><h2 className="text-sm text-muted-foreground">Total Amount Due</h2><Button asChild variant="link" size="sm" className="h-auto px-0"><Link to="/attention">View</Link></Button></div><p className="mt-1 text-2xl font-semibold tabular-nums">{usd(stats.due)}</p></div>
    </div>
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Category Summary — {monthAbbr}</h2>
      <div className="mt-3 overflow-x-auto" role="region" aria-label="Category summary" tabIndex={0}>
        <table className="w-full min-w-[660px] text-center text-sm">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground"><tr>{[`Category (${monthAbbr})`, `Total (${monthAbbr})`, "Amount Due", "Last Visit", "Next Visit"].map((label) => <th key={label} scope="col" className="px-3 py-3 text-center font-medium whitespace-nowrap">{label}</th>)}</tr></thead>
          <tbody>{stats.rows.map((row, i) => <tr key={`${i}-${row.category}`} className="border-b border-border"><th scope="row" className="px-3 py-4 text-center font-medium whitespace-nowrap">{row.category}</th><td className="px-3 py-4 tabular-nums whitespace-nowrap">{usd(row.total)}</td><td className="px-3 py-4 tabular-nums whitespace-nowrap">{usd(row.due)}</td><td className="px-3 py-4 whitespace-nowrap">{dateLabel(row.lastVisit)}</td><td className="px-3 py-4 whitespace-nowrap"><span>{dateLabel(row.nextVisit)}</span>{row.nextVisit && row.nextVisit < localISO(today) && <span className="ml-2 text-xs font-medium text-destructive">Overdue</span>}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Household Spending — Last 3 Months</h2>
      {!hasSpending && <p className="mt-1 text-sm text-muted-foreground">No spending recorded in the last three months.</p>}
      <div className="mt-4 h-80 w-full" role="img" aria-label="Stacked household spending for the last three calendar months">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={stats.chart} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} interval={0} />
          <YAxis width={64} tickLine={false} axisLine={false} domain={[0, yMax]} ticks={yTicks} tickFormatter={(n: number) => `$${n.toLocaleString("en-US")}`} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <Tooltip cursor={{ fill: "var(--accent)" }} formatter={(n: number) => usd(n)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {stats.series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.name} stackId="household" fill={chartColors[i % chartColors.length]} maxBarSize={80} />)}
        </BarChart></ResponsiveContainer>
      </div>
    </section>
  </AppShell>;
}
