import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { setStar, starsQuery } from "@/lib/stars";

export function StarButton({ userId, providerId, name }: { userId: string; providerId: string; name: string }) {
  const qc = useQueryClient();
  const { data } = useQuery(starsQuery());
  const [busy, setBusy] = useState(false);
  const on = data?.has(providerId) ?? false;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !on;
    qc.setQueryData(starsQuery().queryKey, (s: Set<string> | undefined) => {
      const n = new Set(s);
      if (next) n.add(providerId); else n.delete(providerId);
      return n;
    });
    try { await setStar(userId, providerId, next); } catch { /* revert below */ }
    await qc.invalidateQueries({ queryKey: ["stars"] });
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? `Unstar ${name}` : `Star ${name}`}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none hover:bg-accent ${on ? "text-primary" : "text-muted-foreground"}`}
    >
      {on ? "★" : "☆"}
    </button>
  );
}
