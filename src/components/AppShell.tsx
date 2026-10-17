import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground";
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-4">
          <Link to="/home" className="text-xl font-bold text-primary">HomeOps</Link>
          <nav className="flex items-center gap-1">
            <Link to="/home" className={linkCls} activeProps={{ className: "bg-accent text-foreground" }}>Home</Link>
            <Link to="/providers" className={linkCls} activeProps={{ className: "bg-accent text-foreground" }}>Providers</Link>
            <Link to="/maintenance" className={linkCls} activeProps={{ className: "bg-accent text-foreground" }}>Maintenance</Link>
            <Link to="/groceries" className={linkCls} activeProps={{ className: "bg-accent text-foreground" }}>Groceries</Link>
            <Link to="/attention" className={linkCls} activeProps={{ className: "bg-accent text-foreground" }}>Needs Attention</Link>
            <button onClick={signOut} className="ml-2 rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
              Log Out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
