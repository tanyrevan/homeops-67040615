import type { ReactNode } from "react";

export const ctrl = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function FilterBar({ children, onReset, showReset }: { children: ReactNode; onReset: () => void; showReset: boolean }) {
  return (
    <div className="mb-5 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
      {showReset && (
        <button type="button" onClick={onReset} className="mt-3 text-sm font-medium text-primary underline">
          Clear filters
        </button>
      )}
    </div>
  );
}

export function Field({ label, htmlFor, children, wide }: { label: string; htmlFor: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

export function NoMatches({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <p className="text-foreground">Nothing matches these filters.</p>
      <button type="button" onClick={onReset} className="mt-3 text-sm font-medium text-primary underline">Clear filters</button>
    </div>
  );
}
