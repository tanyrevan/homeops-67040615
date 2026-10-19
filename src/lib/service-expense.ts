import { supabase } from "@/integrations/supabase/client";
import { expenseTypeLabel } from "@/lib/expense-type";
import { removeReceipt, uploadReceipt } from "@/lib/visits-api";
import type { VisitSubmit } from "@/components/VisitForm";

export type ExpenseProvider = { name: string; service_type: string; phone_or_contact: string | null };
export type ExistingExpense = { id: string; receipt_url: string | null; provider: ExpenseProvider & { id: string } };

export function suitableProvider<T extends ExpenseProvider & { user_id: string; id: string }>(rows: T[], userId: string, requested: ExpenseProvider): T | undefined {
  return rows.find((p) => p.user_id === userId &&
    p.name.trim().toLowerCase() === requested.name.trim().toLowerCase() &&
    expenseTypeLabel(p.service_type) === expenseTypeLabel(requested.service_type) &&
    (p.phone_or_contact?.trim() || null) === (requested.phone_or_contact?.trim() || null));
}

/** Preserve shared providers on edits: changed identities are reused or created, never rewritten. */
export async function saveServiceExpense(userId: string, submission: VisitSubmit, requested: ExpenseProvider, existing?: ExistingExpense): Promise<string> {
  let providerId: string | undefined;
  let createdProvider: string | undefined;
  let path = existing?.receipt_url ?? null;
  let uploaded: string | null = null;
  try {
    if (existing && suitableProvider([{ ...existing.provider, user_id: userId }], userId, requested)) {
      providerId = existing.provider.id;
    } else {
      for (let from = 0; !providerId; from += 500) {
        const { data, error } = await supabase.from("service_providers").select("*").eq("user_id", userId).order("created_at").range(from, from + 499);
        if (error) throw error;
        providerId = suitableProvider(data, userId, requested)?.id;
        if (data.length < 500) break;
      }
      if (!providerId) {
        const { data, error } = await supabase.from("service_providers").insert({ ...requested, user_id: userId }).select("id").single();
        if (error) throw error;
        providerId = data.id;
        createdProvider = data.id;
      }
    }
    if (submission.file) {
      uploaded = await uploadReceipt(userId, submission.file);
      path = uploaded;
    } else if (submission.removeReceipt) path = null;
    const values = { ...submission.data, service_provider_id: providerId, receipt_url: path };
    const result = existing
      ? await supabase.from("maintenance_visits").update(values).eq("id", existing.id).eq("user_id", userId).select("id").single()
      : await supabase.from("maintenance_visits").insert({ ...values, user_id: userId }).select("id").single();
    if (result.error) throw result.error;
    if (existing && path !== existing.receipt_url) await removeReceipt(existing.receipt_url);
    return result.data.id;
  } catch (error) {
    if (uploaded) await removeReceipt(uploaded);
    if (createdProvider) await supabase.from("service_providers").delete().eq("id", createdProvider).eq("user_id", userId);
    throw error;
  }
}