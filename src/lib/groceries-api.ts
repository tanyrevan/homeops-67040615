import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { removeReceipt, uploadReceipt } from "@/lib/visits-api";
import type { GrocerySubmit } from "@/components/GroceryForm";

/** Upload first, then commit the path; failed saves remove only the newly uploaded file. */
export async function saveGroceryExpense(userId: string, submission: GrocerySubmit, existing?: { id: string; receipt_url: string | null }): Promise<string> {
  let uploaded: string | null = null;
  let path = existing?.receipt_url ?? null;
  try {
    if (submission.file) {
      uploaded = await uploadReceipt(userId, submission.file, "groceries");
      path = uploaded;
    } else if (submission.removeReceipt) path = null;
    const values = { ...submission.data, receipt_url: path };
    const result = existing
      ? await supabase.from("grocery_expenses").update(values).eq("id", existing.id).eq("user_id", userId).select("id").single()
      : await supabase.from("grocery_expenses").insert({ ...values, user_id: userId }).select("id").single();
    if (result.error) throw result.error;
    if (existing && path !== existing.receipt_url) await removeReceipt(existing.receipt_url);
    return result.data.id;
  } catch (error) {
    if (uploaded) await removeReceipt(uploaded);
    throw error;
  }
}

export const groceriesQuery = () =>
  queryOptions({
    queryKey: ["groceries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grocery_expenses")
        .select("*")
        .order("purchase_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const groceryQuery = (id: string) =>
  queryOptions({
    queryKey: ["groceries", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("grocery_expenses").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
