import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const starsQuery = () =>
  queryOptions({
    queryKey: ["stars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stars").select("service_provider_id");
      if (error) throw error;
      return new Set(data.map((s) => s.service_provider_id));
    },
  });

/** Starred first, then the rest; each group keeps its incoming (newest-first) order. */
export function orderByStar<T extends { id: string }>(items: T[], starred: Set<string>, starredOnly = false): T[] {
  const top = items.filter((i) => starred.has(i.id));
  return starredOnly ? top : [...top, ...items.filter((i) => !starred.has(i.id))];
}

export async function setStar(userId: string, providerId: string, on: boolean) {
  if (on) {
    const { error } = await supabase
      .from("stars")
      .upsert({ user_id: userId, service_provider_id: providerId }, { onConflict: "user_id,service_provider_id", ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("stars").delete().eq("service_provider_id", providerId);
    if (error) throw error;
  }
}
