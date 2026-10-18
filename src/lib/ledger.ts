import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { newestExpenses, type HistoryItem } from "@/lib/list-filters";
import { expenseTypeLabel } from "@/lib/expense-type";

export const expenseVisitsQuery = queryOptions({
  queryKey: ["visits", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("maintenance_visits")
      .select("id, visit_date, service_performed, amount_paid, paid, created_at, receipt_url, service_provider_id, service_providers(name, service_type)")
      .order("visit_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const expenseGroceriesQuery = queryOptions({
  queryKey: ["groceries", "history"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("grocery_expenses")
      .select("id, purchase_date, store, amount, reimbursed, created_at, receipt_url")
      .order("purchase_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});

type VisitRow = { id: string; visit_date: string; service_performed: string; amount_paid: number | null; paid: boolean; created_at: string; receipt_url: string | null; service_provider_id: string; service_providers: { name: string; service_type: string } | null };
type GroceryRow = { id: string; purchase_date: string; store: string; amount: number; reimbursed: boolean; created_at: string; receipt_url: string | null };

/** Maps the two expense tables into one ledger shape (display only; tables stay separate). */
export function toLedgerItems(visits: VisitRow[], groceries: GroceryRow[]): HistoryItem[] {
  return newestExpenses([
    ...visits.map((v): HistoryItem => ({
      kind: "visit", id: v.id, date: v.visit_date,
      type: expenseTypeLabel(v.service_providers?.service_type ?? "Other"),
      title: v.service_performed, subtitle: v.service_providers?.name ?? "Provider",
      providerId: v.service_provider_id,
      amount: v.amount_paid, settled: v.paid, receipt_url: v.receipt_url, created_at: v.created_at,
    })),
    ...groceries.map((g): HistoryItem => ({
      kind: "grocery", id: g.id, date: g.purchase_date,
      type: "Grocery", title: g.store, subtitle: "Grocery",
      providerId: null,
      amount: g.amount, settled: g.reimbursed, receipt_url: g.receipt_url, created_at: g.created_at,
    })),
  ]);
}
