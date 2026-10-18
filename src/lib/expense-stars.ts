import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HistoryItem } from "@/lib/list-filters";

export type ExpenseRef = Pick<HistoryItem, "kind" | "id">;
export const expenseStarKey = (item: ExpenseRef) => `${item.kind}-${item.id}`;

export const expenseStarsQuery = (userId: string) => queryOptions({
  queryKey: ["expense-stars", userId],
  queryFn: async () => {
    const starred = new Set<string>();
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from("expense_stars")
        .select("visit_id, grocery_id").eq("user_id", userId).order("id").range(offset, offset + 499);
      if (error) throw error;
      for (const row of data) {
        if (row.visit_id) starred.add(expenseStarKey({ kind: "visit", id: row.visit_id }));
        if (row.grocery_id) starred.add(expenseStarKey({ kind: "grocery", id: row.grocery_id }));
      }
      if (data.length < 500) return starred;
    }
  },
});

export function filterStarredExpenses<T extends ExpenseRef>(items: T[], stars: Set<string>, only: boolean): T[] {
  return only ? items.filter((item) => stars.has(expenseStarKey(item))) : items;
}

export function updateExpenseStars(stars: Set<string>, item: ExpenseRef, on: boolean) {
  const next = new Set(stars);
  if (on) next.add(expenseStarKey(item));
  else next.delete(expenseStarKey(item));
  return next;
}

export async function setExpenseStar(userId: string, item: ExpenseRef, on: boolean) {
  const column = item.kind === "visit" ? "visit_id" : "grocery_id";
  if (on) {
    const { error } = await supabase.from("expense_stars").upsert(
      item.kind === "visit" ? { user_id: userId, visit_id: item.id } : { user_id: userId, grocery_id: item.id },
      { onConflict: `user_id,${column}`, ignoreDuplicates: true },
    );
    if (error) throw error;
  } else {
    const { error } = await supabase.from("expense_stars").delete().eq("user_id", userId).eq(column, item.id);
    if (error) throw error;
  }
}