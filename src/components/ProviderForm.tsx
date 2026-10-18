import { useState, type FormEvent } from "react";
import { SERVICE_TYPES, validateProvider, type ProviderErrors, type ProviderFormValues } from "@/lib/provider-validation";
import { expenseTypeLabel } from "@/lib/expense-type";

type Saved = { name: string; service_type: string; phone_or_contact: string | null; notes: string | null };

export function ProviderForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ProviderFormValues;
  submitLabel: string;
  onSubmit: (data: Saved) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<ProviderErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ProviderFormValues) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const r = validateProvider(v);
    if (!r.ok) return setErrors(r.errors);
    setErrors({});
    setBusy(true);
    const err = await onSubmit(r.data);
    setBusy(false);
    if (err) setFormError(err);
  }

  const input = "w-full rounded-md border border-input bg-background px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const label = "mb-1 block text-sm font-medium text-foreground";
  const err = (m?: string) => m && <p className="mt-1 text-sm text-destructive">{m}</p>;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor="name" className={label}>Name *</label>
        <input id="name" className={input} value={v.name} onChange={set("name")} />
        {err(errors.name)}
      </div>
      <div>
        <label htmlFor="serviceChoice" className={label}>Service type *</label>
        <select id="serviceChoice" className={input} value={v.serviceChoice} onChange={set("serviceChoice")}>
          <option value="">Choose a service type…</option>
          {SERVICE_TYPES.map((t) => <option key={t} value={t}>{expenseTypeLabel(t)}</option>)}
        </select>
        {err(errors.serviceChoice)}
      </div>
      {v.serviceChoice === "Other" && (
        <div>
          <label htmlFor="customType" className={label}>Type the service *</label>
          <input id="customType" className={input} value={v.customType} onChange={set("customType")} placeholder="e.g. Plumber, Cleaner, Handyman" />
          {err(errors.customType)}
        </div>
      )}
      <div>
        <label htmlFor="phone" className={label}>Phone or contact</label>
        <input id="phone" className={input} value={v.phone} onChange={set("phone")} placeholder="Optional" />
      </div>
      <div>
        <label htmlFor="notes" className={label}>Notes</label>
        <textarea id="notes" rows={4} className={input} value={v.notes} onChange={set("notes")} placeholder="Optional" />
      </div>
      {formError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={busy} className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {busy ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-input px-5 py-3 font-medium text-foreground hover:bg-accent">
          Cancel
        </button>
      </div>
    </form>
  );
}
