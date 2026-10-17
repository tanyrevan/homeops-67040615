import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const RECEIPTS_BUCKET = "receipts";

export const providerVisitsQuery = (providerId: string) =>
  queryOptions({
    queryKey: ["visits", "provider", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_visits")
        .select("*")
        .eq("service_provider_id", providerId)
        .order("visit_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const visitQuery = (id: string) =>
  queryOptions({
    queryKey: ["visits", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_visits")
        .select("*, service_providers(id, name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const receiptUrlQuery = (path: string | null) =>
  queryOptions({
    queryKey: ["receipt-url", path],
    enabled: !!path,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });

/** Uploads into the owner's own folder; storage rules only allow `${userId}/...`. */
export async function uploadReceipt(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/visits/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, file, file.type ? { contentType: file.type } : {});
  if (error) throw error;
  return path;
}

export async function removeReceipt(path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
}

export const money = (n: number | null) =>
  n == null ? null : n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export const day = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : null;
