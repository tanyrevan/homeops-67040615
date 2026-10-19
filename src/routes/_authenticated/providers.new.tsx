import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { VisitForm } from "@/components/VisitForm";
import { saveServiceExpense } from "@/lib/service-expense";
import { SERVICE_TYPES } from "@/lib/provider-validation";
import { providersQuery } from "@/lib/providers-api";
import { expenseTypeLabel } from "@/lib/expense-type";

export const Route = createFileRoute("/_authenticated/providers/new")({
  head: () => ({
    meta: [
      { title: "Add Expense | 16 Olive Road" },
      { name: "description", content: "Record a household expense: a grocery purchase or a service visit." },
      { property: "og:title", content: "Add Expense | 16 Olive Road" },
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


  // Existing providers matching the chosen service type, plus any custom types already in use.
  const customTypes = [...new Set((providers.data ?? []).map((p) => p.service_type).filter((t) => t && !(SERVICE_TYPES as readonly string[]).includes(t)))].sort();


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
          {SERVICE_TYPES.map((t) => <option key={t} value={t}>{expenseTypeLabel(t)}</option>)}
          {customTypes.map((t) => <option key={t} value={t}>{expenseTypeLabel(t)}</option>)}
        </select>
      </div>
      {expenseType && (
        <VisitForm
          key={expenseType}
          expenseType={expenseType}
          providerInitial={{ name: "", phone: "", customType: "" }}
          initial={{ visitDate: new Date().toLocaleDateString("en-CA"), service: "", amount: "", notes: "", paid: null }}
          submitLabel="Save Expense"
          onCancel={() => navigate({ to: "/providers" })}
          onSubmit={async (submission) => {
            if (!submission.provider) return "Please enter the name.";
            try {
              const id = await saveServiceExpense(user.id, submission, submission.provider);
              await Promise.all([qc.invalidateQueries({ queryKey: ["providers"] }), qc.invalidateQueries({ queryKey: ["visits"] })]);
              navigate({ to: "/visits/$visitId", params: { visitId: id } });
              return null;
            } catch { return "We couldn't save this expense. Please try again."; }
          }}
        />
      )}
    </AppShell>
  );
}
