import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ExpenseProvider } from "@/lib/service-expense";
import { YesNo } from "@/components/StatusBadge";
import { RECEIPT_ACCEPT, serviceExample, validateReceipt, validateVisit, type VisitErrors, type VisitFormValues } from "@/lib/visit-validation";

export type VisitSubmit = {
  data: { visit_date: string; service_performed: string; amount_paid: number | null; notes: string | null; paid: boolean };
  file: File | null;
  removeReceipt: boolean;
  provider?: ExpenseProvider;
};

export function VisitForm({
  initial,
  hasReceipt = false,
  submitLabel,
  onSubmit,
  onCancel,
  providerInitial,
  expenseType,
}: {
  initial: VisitFormValues;
  hasReceipt?: boolean;
  submitLabel: string;
  onSubmit: (s: VisitSubmit) => Promise<string | null>;
  onCancel: () => void;
  providerInitial?: { name: string; phone: string; customType?: string };
  expenseType?: string;
}) {
  const [v, setV] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [errors, setErrors] = useState<VisitErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState(providerInitial);
  const [providerErrors, setProviderErrors] = useState<{ name?: string; customType?: string }>({});
  const set = (k: keyof VisitFormValues) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const r = validateVisit(v);
    const fileErr = file ? validateReceipt(file) : null;
    const pe = provider ? {
      ...(!provider.name.trim() ? { name: "Please enter the name." } : {}),
      ...(expenseType === "Other" && !provider.customType?.trim() ? { customType: "Please enter the expense type." } : {}),
    } : {};
    setProviderErrors(pe);
    if (Object.keys(pe).length) { setErrors({ ...(r.ok ? {} : r.errors), ...(fileErr ? { receipt: fileErr } : {}) }); return; }
    if (!r.ok || fileErr) return setErrors({ ...(r.ok ? {} : r.errors), ...(fileErr ? { receipt: fileErr } : {}) });
    setErrors({});
    setBusy(true);
    try {
      const err = await onSubmit({ data: r.data, file, removeReceipt: removeExisting,
        ...(provider ? { provider: { name: provider.name.trim(), phone_or_contact: provider.phone.trim() || null, service_type: expenseType === "Other" ? provider.customType?.trim() || "Other" : expenseType || "Other" } } : {}),
      });
      if (err) setFormError(err);
    } catch { setFormError("We couldn't save this expense. Please try again."); }
    finally { setBusy(false); }
  }

  const input = "w-full rounded-md border border-input bg-background px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const label = "mb-1 block text-sm font-medium text-foreground";
  const err = (m?: string) => m && <p className="mt-1 text-sm text-destructive">{m}</p>;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {provider && <>
        {expenseType === "Other" && <div>
          <label htmlFor="customType" className={label}>Custom Expense Type *</label>
          <input id="customType" className={input} value={provider.customType ?? ""} onChange={(e) => setProvider({ ...provider, customType: e.target.value })} />
          {err(providerErrors.customType)}
        </div>}
        <div>
          <label htmlFor="name" className={label}>Name *</label>
          <input id="name" className={input} value={provider.name} onChange={(e) => setProvider({ ...provider, name: e.target.value })} />
          {err(providerErrors.name)}
        </div>
        <div>
          <label htmlFor="phone" className={label}>Phone</label>
          <input id="phone" className={input} value={provider.phone} onChange={(e) => setProvider({ ...provider, phone: e.target.value })} />
        </div>
      </>}
      <div>
        <label htmlFor="visitDate" className={label}>Date *</label>
        <input id="visitDate" type="date" className={input} value={v.visitDate} onChange={set("visitDate")} />
        {err(errors.visitDate)}
      </div>
      <div>
        <label htmlFor="service" className={label}>Service Performed</label>
        <input id="service" className={input} value={v.service} onChange={set("service")} placeholder={serviceExample(expenseType)} />
        {err(errors.service)}
      </div>
      <div>
        <label htmlFor="amount" className={label}>Amount</label>
        <input id="amount" type="number" inputMode="decimal" min="0" step="0.01" className={input} value={v.amount} onChange={set("amount")} placeholder="e.g. 75.00" />
        {err(errors.amount)}
      </div>
      <YesNo label="Paid? *" name="paid" value={v.paid} onChange={(paid) => setV({ ...v, paid })} />
      {err(errors.paid)}
      <div>
        <label htmlFor="notes" className={label}>Notes</label>
        <textarea id="notes" rows={3} className={input} value={v.notes} onChange={set("notes")} placeholder="Optional" />
      </div>
      <div>
        <label htmlFor="receipt" className={label}>Upload Receipt</label>
        {hasReceipt && !file && (
          <div className="mb-2 flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{removeExisting ? "Receipt will be removed." : "A receipt is already saved."}</span>
            <Button variant="link" type="button" onClick={() => setRemoveExisting(!removeExisting)} className="font-medium text-primary underline">
              {removeExisting ? "Keep it" : "Remove receipt"}
            </Button>
          </div>
        )}
        <input id="receipt" type="file" accept={RECEIPT_ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium file:text-foreground" />
        {err(errors.receipt)}
      </div>
      {formError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={busy} className="h-auto px-5 py-3">
          {busy ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-auto px-5 py-3">Cancel</Button>
      </div>
    </form>
  );
}
