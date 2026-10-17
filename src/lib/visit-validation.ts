export const RECEIPT_ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif";
const RECEIPT_EXT = ["jpg", "jpeg", "png", "heic", "heif"];
export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

export type VisitFormValues = {
  visitDate: string;
  service: string;
  amount: string;
  notes: string;
  nextDate: string;
};
export type VisitErrors = Partial<Record<"visitDate" | "service" | "amount" | "nextDate" | "receipt", string>>;

export function validateVisit(v: VisitFormValues):
  | { ok: true; data: { visit_date: string; service_performed: string; amount_paid: number | null; notes: string | null; next_service_date: string | null } }
  | { ok: false; errors: VisitErrors } {
  const errors: VisitErrors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.visitDate)) errors.visitDate = "Please choose the visit date.";
  const service = v.service.trim();
  if (!service) errors.service = "Please describe the service performed.";
  let amount: number | null = null;
  const raw = v.amount.trim();
  if (raw) {
    const n = Number(raw);
    if (!Number.isFinite(n)) errors.amount = "Please enter a number, like 75 or 75.50.";
    else if (n < 0) errors.amount = "Amount paid can't be negative.";
    else amount = Math.round(n * 100) / 100;
  }
  if (v.nextDate && !/^\d{4}-\d{2}-\d{2}$/.test(v.nextDate)) errors.nextDate = "Please choose a valid date.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      visit_date: v.visitDate,
      service_performed: service,
      amount_paid: amount,
      notes: v.notes.trim() || null,
      next_service_date: v.nextDate || null,
    },
  };
}

export function validateReceipt(file: { name: string; size: number; type: string }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!file.type.startsWith("image/") && !RECEIPT_EXT.includes(ext)) return "Please choose a photo (JPG, PNG, or HEIC).";
  if (!RECEIPT_EXT.includes(ext) && !["image/jpeg", "image/png", "image/heic", "image/heif"].includes(file.type))
    return "Please choose a photo (JPG, PNG, or HEIC).";
  if (file.size > MAX_RECEIPT_BYTES) return "That photo is too large. Please choose one under 10 MB.";
  return null;
}
