import { expenseTypeLabel } from "@/lib/expense-type";

export const RECEIPT_ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif";
const RECEIPT_EXT = ["jpg", "jpeg", "png", "heic", "heif"];
export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

/** Category-specific Service Performed placeholder examples; Other and unknown types get none. */
const SERVICE_EXAMPLES: Record<string, string> = {
  Gardener: "e.g. Trimmed hedges, mowed lawn",
  Jacuzzi: "e.g. Cleaned filters, balanced chemicals",
  Aircon: "e.g. Serviced unit, cleaned filters",
  Electrician: "e.g. Replaced outlet, fixed lighting",
  "House Painting": "e.g. Painted bedroom, touched up walls",
};
export function serviceExample(expenseType: string | undefined): string | undefined {
  if (!expenseType) return undefined;
  return SERVICE_EXAMPLES[expenseTypeLabel(expenseType)];
}

export type VisitFormValues = {
  visitDate: string;
  service: string;
  amount: string;
  notes: string;
  paid: boolean | null;
};
export type VisitErrors = Partial<Record<"visitDate" | "service" | "amount" | "receipt" | "paid", string>>;

export function validateVisit(v: VisitFormValues):
  | { ok: true; data: { visit_date: string; service_performed: string; amount_paid: number | null; notes: string | null; paid: boolean } }
  | { ok: false; errors: VisitErrors } {
  const errors: VisitErrors = {};
  if (typeof v.paid !== "boolean") errors.paid = "Please choose Yes or No for Paid.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.visitDate)) errors.visitDate = "Please choose the visit date.";
  const service = v.service.trim();
  let amount: number | null = null;
  const raw = v.amount.trim();
  if (raw) {
    const n = Number(raw);
    if (!Number.isFinite(n)) errors.amount = "Please enter a number, like 75 or 75.50.";
    else if (n < 0) errors.amount = "Amount can't be negative.";
    else amount = Math.round(n * 100) / 100;
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      visit_date: v.visitDate,
      service_performed: service,
      amount_paid: amount,
      notes: v.notes.trim() || null,
      paid: v.paid === true,
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
