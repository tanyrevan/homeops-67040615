import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { GroceryForm } from "@/components/GroceryForm";
import { supabase } from "@/integrations/supabase/client";
import { groceryQuery } from "@/lib/groceries-api";
import { removeReceipt, uploadReceipt } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/groceries/$groceryId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Purchase — 16 Olive Road" },
      { name: "description", content: "Edit a grocery purchase." },
      { property: "og:title", content: "Edit Purchase — 16 Olive Road" },
      { property: "og:description", content: "Edit a grocery purchase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditGrocery,
});

function EditGrocery() {
  const { groceryId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: g, isLoading } = useQuery(groceryQuery(groceryId));
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Edit Purchase</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !g && <p className="text-foreground">This purchase wasn't found.</p>}
      {g && (
        <GroceryForm
          initial={{ purchaseDate: g.purchase_date, store: g.store, amount: String(g.amount), notes: g.notes ?? "", reimbursed: g.reimbursed }}
          hasReceipt={!!g.receipt_url}
          submitLabel="Save Changes"
          onCancel={() => navigate({ to: "/groceries/$groceryId", params: { groceryId } })}
          onSubmit={async ({ data, file, removeReceipt: drop }) => {
            let path = g.receipt_url;
            if (file) {
              try { path = await uploadReceipt(user.id, file, "groceries"); } catch { return "We couldn't upload the receipt. Please try again."; }
            } else if (drop) path = null;
            const { error } = await supabase.from("grocery_expenses").update({ ...data, receipt_url: path }).eq("id", groceryId);
            if (error) { if (file) await removeReceipt(path); return "We couldn't save your changes. Please try again."; }
            if (path !== g.receipt_url) await removeReceipt(g.receipt_url);
            await qc.invalidateQueries({ queryKey: ["groceries"] });
            navigate({ to: "/groceries/$groceryId", params: { groceryId } });
            return null;
          }}
        />
      )}
    </AppShell>
  );
}
