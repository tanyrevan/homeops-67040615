import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const expensesArea = ["/providers", "/groceries"].some((path) => pathname === path || pathname.startsWith(`${path}/`));

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
          <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
            <Link to="/home" className={linkCls} activeProps={{ className: "bg-accent text-foreground" }}>Dashboard</Link>
            <Link to="/providers" className={`${linkCls} ${expensesArea ? "bg-accent text-foreground" : ""}`}>Expenses</Link>
            <Link to="/maintenance" className={`${linkCls} ${pathname.startsWith("/visits/") ? "bg-accent text-foreground" : ""}`} activeProps={{ className: "bg-accent text-foreground" }}>History</Link>
            <Link to="/upcoming" className={linkCls} activeProps={{ className: "bg-accent text-foreground" }}>Upcoming</Link>
            <Button variant="outline" size="sm" onClick={signOut} className="ml-2">
              Log Out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
