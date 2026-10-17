import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { groceryByMonth, monthKey, monthSummary, usd } from "@/lib/dashboard-stats";

/** Fetch only rows from the chart window (6 months); RLS limits them to the signed-in user. */
const dashboardQuery = queryOptions({
  queryKey: ["dashboard", monthKey(new Date())],
  queryFn: async () => {
    const now = new Date();
    const start = `${monthKey(new Date(now.getFullYear(), now.getMonth() - 5, 1))}-01`;
    const [g, v] = await Promise.all([
      supabase.from("grocery_expenses").select("purchase_date, amount").gte("purchase_date", start),
      supabase.from("maintenance_visits").select("visit_date, amount_paid").gte("visit_date", `${monthKey(now)}-01`),
    ]);
    if (g.error) throw g.error;
    if (v.error) throw v.error;
    return { groceries: g.data, visits: v.data };
  },
});

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Dashboard — HomeOps" },
      { name: "description", content: "Your household spending at a glance." },
      { property: "og:title", content: "Dashboard — HomeOps" },
      { property: "og:description", content: "Your household spending at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, error } = useQuery(dashboardQuery);
  const today = new Date();
  const summary = monthSummary(data?.groceries ?? [], data?.visits ?? [], today);
  const chart = groceryByMonth(data?.groceries ?? [], today);
  const hasChartData = chart.some((m) => m.total > 0);
  const monthName = today.toLocaleDateString("en-US", { month: "long" });

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Your household at a glance.</p>
      {error && <p className="mt-4 text-destructive">We couldn't load your dashboard. Please refresh.</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label={`${monthName} Grocery Total`} value={isLoading ? "…" : usd(summary.groceryTotal)} />
        <Stat label={`${monthName} Maintenance Total`} value={isLoading ? "…" : usd(summary.maintenanceTotal)} />
        <Stat
          label="Maintenance Visits This Month"
          value={isLoading ? "…" : `${summary.visitCount} ${summary.visitCount === 1 ? "visit" : "visits"}`}
        />
      </div>

      <section className="mt-8 rounded-lg border border-border bg-card p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Grocery Spending — Last 6 Months</h2>
        {!isLoading && !hasChartData && (
          <p className="mt-1 text-sm text-muted-foreground">No grocery purchases in the last 6 months yet.</p>
        )}
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 13 }} />
              <YAxis
                width={56}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, hasChartData ? "auto" : 100]}
                tickFormatter={(n: number) => `$${n.toLocaleString("en-US")}`}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                formatter={(n: number) => [usd(n), "Spent"]}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }}
              />
              <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
