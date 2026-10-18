export function StatusBadge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? (
    <span className="inline-flex items-center rounded-full border border-paid-border bg-paid px-2.5 py-0.5 text-xs font-semibold text-paid-foreground">✓ {yes}</span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">{no}</span>
  );
}

export function YesNo({ label, name, value, onChange }: { label: string; name: string; value: boolean; onChange: (v: boolean) => void }) {
  const opt = (v: boolean, text: string) => (
    <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 font-medium ${value === v ? "border-primary bg-primary/10 text-foreground" : "border-input text-muted-foreground"}`}>
      <input type="radio" name={name} value={text} checked={value === v} onChange={() => onChange(v)} className="accent-primary" />
      {text}
    </label>
  );
  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-foreground">{label}</legend>
      <div className="flex gap-3">{opt(true, "Yes")}{opt(false, "No")}</div>
    </fieldset>
  );
}
