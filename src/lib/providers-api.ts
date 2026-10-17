import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { filterOwnedRecords } from "@/lib/ownership";

export const providersQuery = () =>
  queryOptions({
    queryKey: ["providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: s } = await supabase.auth.getSession();
      return filterOwnedRecords(data, s.session?.user.id ?? "");
    },
  });

export const providerQuery = (id: string) =>
  queryOptions({
    queryKey: ["providers", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_providers").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
