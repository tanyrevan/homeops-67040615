import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { GroceryForm } from "@/components/GroceryForm";
import { saveGroceryExpense } from "@/lib/groceries-api";
import { expenseSaveError } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/groceries/new")({
  head: () => ({
    meta: [
      { title: "Add Grocery Purchase | 16 Olive Road" },
      { name: "description", content: "Log a grocery purchase." },
      { property: "og:title", content: "Add Grocery Purchase | 16 Olive Road" },
      { property: "og:description", content: "Log a grocery purchase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewGrocery,
});

function NewGrocery() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const today = new Date().toLocaleDateString("en-CA");
  return (
    <AppShell>
      <Link to="/providers" className="text-sm text-muted-foreground hover:text-foreground">← Back to Expenses</Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold text-foreground">Add Grocery Purchase</h1>
      <GroceryForm
        initial={{ purchaseDate: today, store: "", amount: "", notes: "", reimbursed: null }}
        submitLabel="Save Purchase"
        onCancel={() => navigate({ to: "/providers" })}
        onSubmit={async (submission) => {
          try {
            await saveGroceryExpense(user.id, submission);
            await qc.invalidateQueries({ queryKey: ["groceries"] });
            navigate({ to: "/providers" });
            return null;
          } catch (error) { return expenseSaveError(error, "We couldn't save this purchase. Please try again."); }
        }}
      />
    </AppShell>
  );
}
