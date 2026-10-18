import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProviderForm } from "@/components/ProviderForm";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_TYPES } from "@/lib/provider-validation";

export const Route = createFileRoute("/_authenticated/providers/new")({
  head: () => ({
    meta: [
      { title: "Add Expense — HomeOps" },
      { name: "description", content: "Add a household expense or service provider." },
      { property: "og:title", content: "Add Expense — HomeOps" },
      { property: "og:description", content: "Add a household expense or service provider." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewExpense,
});

function NewExpense() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [expenseType, setExpenseType] = useState("");
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Add Expense</h1>
      <div className="mb-5">
        <label htmlFor="expense-type" className="mb-1 block text-sm font-medium text-foreground">Expense Type</label>
        <select
          id="expense-type"
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={expenseType}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "Grocery") {
              // Groceries use the existing grocery expense workflow and table.
              navigate({ to: "/groceries/new" });
              return;
            }
            setExpenseType(v);
          }}
        >
          <option value="">Choose an expense type…</option>
          <option value="Grocery">Grocery</option>
          {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {expenseType && (
        <ProviderForm
          key={expenseType}
          initial={{ name: "", serviceChoice: expenseType, customType: "", phone: "", notes: "" }}
          submitLabel="Save Expense"
          onCancel={() => navigate({ to: "/providers" })}
          onSubmit={async (d) => {
            const { data, error } = await supabase.from("service_providers").insert({ ...d, user_id: user.id }).select("id").single();
            if (error) return "We couldn't save this expense. Please try again.";
            await qc.invalidateQueries({ queryKey: ["providers"] });
            navigate({ to: "/providers/$id", params: { id: data.id } });
            return null;
          }}
        />
      )}
    </AppShell>
  );
}
