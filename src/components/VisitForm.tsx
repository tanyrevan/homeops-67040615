import { useState, type FormEvent } from "react";
import { RECEIPT_ACCEPT, validateReceipt, validateVisit, type VisitErrors, type VisitFormValues } from "@/lib/visit-validation";

export type VisitSubmit = {
  data: { visit_date: string; service_performed: string; amount_paid: number | null; notes: string | null; next_service_date: string | null };
  file: File | null;
  removeReceipt: boolean;
};

export function VisitForm({
  initial,
  hasReceipt = false,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: VisitFormValues;
  hasReceipt?: boolean;
  submitLabel: string;
  onSubmit: (s: VisitSubmit) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [errors, setErrors] = useState<VisitErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof VisitFormValues) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const r = validateVisit(v);
    const fileErr = file ? validateReceipt(file) : null;
    if (!r.ok || fileErr) return setErrors({ ...(r.ok ? {} : r.errors), ...(fileErr ? { receipt: fileErr } : {}) });
    setErrors({});
    setBusy(true);
    const err = await onSubmit({ data: r.data, file, removeReceipt: removeExisting });
    setBusy(false);
    if (err) setFormError(err);
  }

  const input = "w-full rounded-md border border-input bg-background px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const label = "mb-1 block text-sm font-medium text-foreground";
  const err = (m?: string) => m && <p className="mt-1 text-sm text-destructive">{m}</p>;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor="visitDate" className={label}>Visit Date *</label>
        <input id="visitDate" type="date" className={input} value={v.visitDate} onChange={set("visitDate")} />
        {err(errors.visitDate)}
      </div>
      <div>
        <label htmlFor="service" className={label}>Service Performed *</label>
        <input id="service" className={input} value={v.service} onChange={set("service")} placeholder="e.g. Trimmed hedges, cleaned filters" />
        {err(errors.service)}
      </div>
      <div>
        <label htmlFor="amount" className={label}>Amount Paid</label>
        <input id="amount" type="number" inputMode="decimal" min="0" step="0.01" className={input} value={v.amount} onChange={set("amount")} placeholder="Optional, e.g. 75.00" />
        {err(errors.amount)}
      </div>
      <div>
        <label htmlFor="notes" className={label}>Notes</label>
        <textarea id="notes" rows={3} className={input} value={v.notes} onChange={set("notes")} placeholder="Optional" />
      </div>
      <div>
        <label htmlFor="nextDate" className={label}>Next Service Date</label>
        <input id="nextDate" type="date" className={input} value={v.nextDate} onChange={set("nextDate")} />
        {err(errors.nextDate)}
      </div>
      <div>
        <label htmlFor="receipt" className={label}>Upload Receipt</label>
        {hasReceipt && !file && (
          <div className="mb-2 flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{removeExisting ? "Receipt will be removed." : "A receipt is already saved."}</span>
            <button type="button" onClick={() => setRemoveExisting(!removeExisting)} className="font-medium text-primary underline">
              {removeExisting ? "Keep it" : "Remove receipt"}
            </button>
          </div>
        )}
        <input id="receipt" type="file" accept={RECEIPT_ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium file:text-foreground" />
        <p className="mt-1 text-xs text-muted-foreground">Optional photo of a receipt or payment (JPG, PNG, HEIC — up to 10 MB).{hasReceipt ? " Choosing a new photo replaces the saved one." : ""}</p>
        {err(errors.receipt)}
      </div>
      {formError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={busy} className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {busy ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-input px-5 py-3 font-medium text-foreground hover:bg-accent">Cancel</button>
      </div>
    </form>
  );
}
