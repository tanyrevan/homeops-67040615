import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { budgetAmountSchema, budgetMonth, budgetProgress } from "@/lib/budget";
import { usd } from "@/lib/dashboard-stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BudgetCard({ spent, loading }: { spent: number; loading: boolean }) {
  const month = budgetMonth(new Date());
  const qc = useQueryClient();
  const { data: budget, isLoading } = useQuery({
    queryKey: ["budget", month],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("id, amount").eq("month", month).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (amount: number) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("budgets")
        .upsert({ user_id: u.user!.id, month, amount }, { onConflict: "user_id,month" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budget", month] });
      setEditing(false);
    },
    onError: () => setErr("We couldn't save your budget. Please try again."),
  });

  const open = () => {
    setValue(budget ? String(Number(budget.amount)) : "");
    setErr(null);
    setEditing(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = budgetAmountSchema.safeParse(value);
    if (!r.success) return setErr(r.error.issues[0]?.message ?? "Please enter a valid amount.");
    setErr(null);
    save.mutate(r.data);
  };

  const p = budget ? budgetProgress(Number(budget.amount), spent) : null;

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Monthly Grocery Budget</h2>
        {!editing && !isLoading && (
          <Button variant={budget ? "outline" : "default"} size="sm" onClick={open}>
            {budget ? "Edit Budget" : "Set Grocery Budget"}
          </Button>
        )}
      </div>

      {editing && (
        <form onSubmit={submit} className="mt-4 flex flex-wrap items-start gap-2" noValidate>
          <div className="flex-1 min-w-[10rem]">
            <label htmlFor="budget-amount" className="sr-only">Budget amount</label>
            <Input
              id="budget-amount"
              inputMode="decimal"
              placeholder="e.g. 1000"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={!!err}
              autoFocus
            />
            {err && <p className="mt-1 text-sm text-destructive">{err}</p>}
          </div>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </form>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Mini label="Budget" value={isLoading ? "…" : budget ? usd(p!.budget) : "Not set"} />
        <Mini label="Grocery Spending This Month" value={loading ? "…" : usd(spent)} />
        <Mini
          label="Remaining Budget"
          value={!p ? "—" : p.over ? `${usd(p.overBy)} over budget` : usd(p.remaining)}
          danger={!!p?.over}
        />
      </div>

      {p && (
        <div className="mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(p.barPercent)} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full ${p.over ? "bg-destructive" : "bg-primary"}`} style={{ width: `${p.barPercent}%` }} />
          </div>
          <p className={`mt-2 text-sm ${p.over ? "text-destructive" : "text-muted-foreground"}`}>
            {p.percent === null
              ? `${usd(p.spent)} spent with a $0 budget — over budget`
              : `${p.percent}% used — ${usd(p.spent)} of ${usd(p.budget)}${p.over ? " (over budget)" : ""}`}
          </p>
        </div>
      )}
      {!isLoading && !budget && !editing && (
        <p className="mt-3 text-sm text-muted-foreground">No budget set for this month yet.</p>
      )}
    </section>
  );
}

function Mini({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
