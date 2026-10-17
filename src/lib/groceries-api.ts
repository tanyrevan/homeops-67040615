import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
