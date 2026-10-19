import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { expenseTypeLabel } from "@/lib/expense-type";
import { supabase } from "@/integrations/supabase/client";
import { day, money, receiptUrlQuery, removeReceipt, visitQuery } from "@/lib/visits-api";

export const Route = createFileRoute("/_authenticated/visits/$visitId/")({
  head: () => ({
    meta: [
      { title: "Expense details — 16 Olive Road" },
      { name: "description", content: "Details of a service expense." },
      { property: "og:title", content: "Expense details — 16 Olive Road" },
      { property: "og:description", content: "Details of a service expense." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VisitDetail,
});

function VisitDetail() {
  const { visitId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: v, isLoading } = useQuery(visitQuery(visitId));
  const receipt = useQuery(receiptUrlQuery(v?.receipt_url ?? null));
  const [showReceipt, setShowReceipt] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function remove() {
    if (!v) return;
    const { error } = await supabase.from("maintenance_visits").delete().eq("id", visitId);
    if (error) return setDelError("We couldn't delete this expense. Please try again.");
    await removeReceipt(v.receipt_url);
    qc.removeQueries({ queryKey: ["visits", visitId] });
    await qc.invalidateQueries({ queryKey: ["visits"] });
    navigate({ to: "/providers" });
  }

  return (
    <AppShell>
      <Link to="/providers" className="text-sm text-muted-foreground hover:text-foreground">← Back to Expenses</Link>
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!isLoading && !v && <p className="mt-6 text-foreground">This expense wasn't found.</p>}
      {v && (
        <div className="mt-4 rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 break-words text-2xl font-semibold text-foreground">{expenseTypeLabel(v.service_providers?.service_type ?? "Other")}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Expense options"
                className="rounded-md border border-input p-2 text-foreground hover:bg-accent"
              >
                <MoreHorizontal className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate({ to: "/visits/$visitId/edit", params: { visitId } })}>
                  Edit Expense
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Expense
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Provider" value={v.service_providers?.name ?? null} />
            <Field label="Visit Date" value={day(v.visit_date)} />
            <Field label="Service Performed" value={v.service_performed} />
            <Field label="Amount" value={money(v.amount_paid)} />
            <div><dt className="text-sm text-muted-foreground">Payment Status</dt><dd className="mt-1"><StatusBadge ok={v.paid} yes="Paid" no="Unpaid" /></dd></div>
            <div className="sm:col-span-2"><Field label="Notes" value={v.notes} /></div>
          </dl>

          {v.receipt_url && (
            <div className="mt-6">
              <p className="mb-2 text-sm text-muted-foreground">Receipt</p>
              <Button variant="outline" onClick={() => setShowReceipt(!showReceipt)}>
                {showReceipt ? "Hide Receipt" : "View Receipt"}
              </Button>
              {showReceipt && (
                <div className="mt-4">
                  {receipt.isLoading && <p className="text-muted-foreground">Loading receipt…</p>}
                  {receipt.error && <p className="text-destructive">We couldn't load the receipt. Please try again.</p>}
                  {receipt.data && (
                    <a href={receipt.data} target="_blank" rel="noreferrer">
                      <img src={receipt.data} alt="Receipt" className="max-h-[70vh] w-full rounded-md border border-border object-contain bg-background" />
                      <span className="mt-1 block text-xs text-muted-foreground">Tap to open full size (some phones may download HEIC photos instead).</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {delError && <p className="mt-4 text-sm text-destructive">{delError}</p>}
          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this expense?</AlertDialogTitle>
                <AlertDialogDescription>This expense{v.receipt_url ? " and its receipt" : ""} will be removed permanently.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
