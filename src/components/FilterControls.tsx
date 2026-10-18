import { useEffect, useRef, useState, type ReactNode } from "react";
import { Funnel } from "lucide-react";
import { Button } from "@/components/ui/button";

export const secondaryFilterControl = "h-10 w-32 gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent";

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

/** Compact Filter button that opens a small popover panel with the filter controls. */
export function FilterPopover({ children, onReset, activeCount }: { children: ReactNode; onReset: () => void; activeCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={secondaryFilterControl}
      >
        <Funnel className="h-4 w-4" aria-hidden="true" />
        Filter{activeCount > 0 ? ` (${activeCount})` : ""}
      </Button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-72 rounded-md border border-border bg-card p-4 shadow-md">
          <div className="grid gap-3">{children}</div>
          <button
            type="button"
            onClick={() => { onReset(); setOpen(false); }}
            className="mt-3 text-sm font-medium text-primary underline"
          >
            Clear filters
          </button>
        </div>
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
