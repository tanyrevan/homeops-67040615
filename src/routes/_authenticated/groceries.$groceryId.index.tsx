import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { groceryQuery } from "@/lib/groceries-api";
import { day, money, receiptUrlQuery, removeReceipt } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/groceries/$groceryId/")({
  head: () => ({
    meta: [
      { title: "Grocery purchase — HomeOps" },
      { name: "description", content: "Details of a grocery purchase." },
      { property: "og:title", content: "Grocery purchase — HomeOps" },
      { property: "og:description", content: "Details of a grocery purchase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroceryDetail,
});

function GroceryDetail() {
  const { groceryId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: g, isLoading } = useQuery(groceryQuery(groceryId));
  const receipt = useQuery(receiptUrlQuery(g?.receipt_url ?? null));
  const [showReceipt, setShowReceipt] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  async function remove() {
    if (!g) return;
    const { error } = await supabase.from("grocery_expenses").delete().eq("id", groceryId);
    if (error) return setDelError("We couldn't delete this purchase. Please try again.");
    await removeReceipt(g.receipt_url);
    qc.removeQueries({ queryKey: ["groceries", groceryId] });
    await qc.invalidateQueries({ queryKey: ["groceries"] });
    navigate({ to: "/groceries", search: { deleted: true } });
  }

  return (
    <AppShell>
      <Link to="/groceries" className="text-sm text-muted-foreground hover:text-foreground">← Back to groceries</Link>
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!isLoading && !g && <p className="mt-6 text-foreground">This purchase wasn't found.</p>}
      {g && (
        <div className="mt-4 rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{day(g.purchase_date)}</p>
          <h1 className="text-2xl font-semibold text-foreground">{g.store}</h1>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Purchase Date" value={day(g.purchase_date)} />
            <Field label="Store" value={g.store} />
            <Field label="Amount" value={money(g.amount)} />
            <div><dt className="text-sm text-muted-foreground">Reimbursement</dt><dd className="mt-1"><StatusBadge ok={g.reimbursed} yes="Reimbursed" no="Not Reimbursed" /></dd></div>
            <Field label="Category" value={g.category} />
            <div className="sm:col-span-2"><Field label="Notes" value={g.notes} /></div>
          </dl>
          {g.receipt_url && (
            <div className="mt-6">
              <button onClick={() => setShowReceipt(!showReceipt)} className="rounded-md border border-input px-5 py-3 font-medium text-foreground hover:bg-accent">
                {showReceipt ? "Hide Receipt" : "View Receipt"}
              </button>
              {showReceipt && (
                <div className="mt-4">
                  {receipt.isLoading && <p className="text-muted-foreground">Loading receipt…</p>}
                  {receipt.error && <p className="text-destructive">We couldn't load the receipt. Please try again.</p>}
                  {receipt.data && (
                    <a href={receipt.data} target="_blank" rel="noreferrer">
                      <img src={receipt.data} alt="Receipt" className="max-h-[70vh] w-full rounded-md border border-border bg-background object-contain" />
                      <span className="mt-1 block text-xs text-muted-foreground">Tap to open full size (some phones may download HEIC photos instead).</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          {delError && <p className="mt-4 text-sm text-destructive">{delError}</p>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/groceries/$groceryId/edit" params={{ groceryId }} className="rounded-md bg-primary px-5 py-3 text-center font-medium text-primary-foreground hover:opacity-90">
              Edit Purchase
            </Link>
            <AlertDialog>
              <AlertDialogTrigger className="rounded-md border border-destructive px-5 py-3 font-medium text-destructive hover:bg-destructive/10">
                Delete Purchase
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this grocery purchase?</AlertDialogTitle>
                  <AlertDialogDescription>This purchase{g.receipt_url ? " and its receipt" : ""} will be removed permanently.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap text-foreground">{value || "—"}</dd>
    </div>
  );
}
