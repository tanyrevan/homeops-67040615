import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProviderForm } from "@/components/ProviderForm";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_TYPES, splitServiceType } from "@/lib/provider-validation";
import { providersQuery } from "@/lib/providers-api";
import { expenseTypeLabel } from "@/lib/expense-type";

export const Route = createFileRoute("/_authenticated/providers/new")({
  head: () => ({
    meta: [
      { title: "Add Expense — HomeOps" },
      { name: "description", content: "Record a household expense: a grocery purchase or a service visit." },
      { property: "og:title", content: "Add Expense — HomeOps" },
      { property: "og:description", content: "Record a household expense: a grocery purchase or a service visit." },
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
  const providers = useQuery(providersQuery());
  const [expenseType, setExpenseType] = useState("");
  const [providerChoice, setProviderChoice] = useState("");

  // Existing providers matching the chosen service type, plus any custom types already in use.
  const customTypes = [...new Set((providers.data ?? []).map((p) => p.service_type).filter((t) => t && !(SERVICE_TYPES as readonly string[]).includes(t)))].sort();
  const matching = (providers.data ?? []).filter((p) => p.service_type === expenseType);

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
            setProviderChoice("");
          }}
        >
          <option value="">Choose an expense type…</option>
          <option value="Grocery">Grocery</option>
          {SERVICE_TYPES.map((t) => <option key={t} value={t}>{expenseTypeLabel(t)}</option>)}
          {customTypes.map((t) => <option key={t} value={t}>{expenseTypeLabel(t)}</option>)}
        </select>
      </div>
      {expenseType && matching.length > 0 && (
        <div className="mb-5">
          <label htmlFor="provider" className="mb-1 block text-sm font-medium text-foreground">Provider</label>
          <select
            id="provider"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={providerChoice}
            onChange={(e) => {
              const v = e.target.value;
              setProviderChoice(v);
              if (v && v !== "new") {
                // Existing provider: record the visit through the existing maintenance workflow.
                navigate({ to: "/providers/$id/visits/new", params: { id: v } });
              }
            }}
          >
            <option value="">Choose a provider…</option>
            {matching.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="new">New provider…</option>
          </select>
        </div>
      )}
      {expenseType && (matching.length === 0 || providerChoice === "new") && (
        <ProviderForm
          key={expenseType}
          categorySelected
          initial={{
            name: "",
            ...splitServiceType(expenseType === "Other" ? "" : expenseType),
            phone: "",
            notes: "",
          }}
          submitLabel="Save Provider"
          onCancel={() => navigate({ to: "/providers" })}
          onSubmit={async (d) => {
            const { data, error } = await supabase.from("service_providers").insert({ ...d, user_id: user.id }).select("id").single();
            if (error) return "We couldn't save this provider. Please try again.";
            await qc.invalidateQueries({ queryKey: ["providers"] });
            navigate({ to: "/providers/$id/visits/new", params: { id: data.id } });
            return null;
          }}
        />
      )}
    </AppShell>
  );
}
