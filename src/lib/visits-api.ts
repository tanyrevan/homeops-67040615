import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { validateReceipt } from "@/lib/visit-validation";

export class ReceiptUploadError extends Error {
  constructor(cause: unknown) {
    super("We couldn't upload the receipt. Your changes weren't saved. Please try again.", { cause });
    this.name = "ReceiptUploadError";
  }
}

export function expenseSaveError(error: unknown, fallback: string): string {
  const cause = error instanceof ReceiptUploadError ? error.cause : error;
  const detail = cause && typeof cause === "object" ? cause as { code?: string; message?: string } : {};
  console.error("Expense save failed", { stage: error instanceof ReceiptUploadError ? "receipt-upload" : "expense-save", code: detail.code, message: detail.message });
  return error instanceof ReceiptUploadError ? error.message : fallback;
}

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
        .select("*, service_providers(id, name, service_type)")
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
      if (!path) return null;
      const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });

/** Uploads into the owner's own folder; storage rules only allow `${userId}/...`. */
export async function uploadReceipt(userId: string, file: File, folder: "visits" | "groceries" = "visits"): Promise<string> {
  try {
    const validation = validateReceipt(file);
    if (validation) throw new Error(validation);
    const types: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic", heif: "image/heif" };
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const ext = types[extension] ? extension : Object.keys(types).find((key) => types[key] === file.type) ?? "jpg";
    const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, file, { contentType: types[ext], upsert: false });
    if (error) throw error;
    return path;
  } catch (error) { throw new ReceiptUploadError(error); }
}

export async function removeReceipt(path: string | null | undefined) {
  if (!path) return;
  // Cleanup is best-effort: never roll back a committed expense because old-file deletion failed.
  try {
    const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
    if (error) console.error("Receipt cleanup failed", { message: error.message });
  } catch { console.error("Receipt cleanup request failed"); }
}

export const money = (n: number | null) =>
  n == null ? null : n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export const day = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : null;
