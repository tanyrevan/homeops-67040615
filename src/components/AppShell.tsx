import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const expensesArea = ["/providers", "/groceries", "/visits"].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const dashboardActive = pathname === "/home";
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-3 py-4 sm:px-4">
          <Link to="/home" className="shrink-0 text-xl font-bold text-primary">HomeOps</Link>
          <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-1.5">
            <Button asChild variant={dashboardActive ? "default" : "outline"} size="sm" className="h-9 border border-border px-2.5 sm:px-3">
              <Link to="/home" aria-current={dashboardActive ? "page" : undefined}>Dashboard</Link>
            </Button>
            <Button asChild variant={expensesArea ? "default" : "outline"} size="sm" className="h-9 border border-border px-2.5 sm:px-3">
              <Link to="/providers" aria-current={expensesArea ? "page" : undefined}>Expenses</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Settings" title="Settings" className="h-9 w-9">
                  <Settings aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => { void signOut(); }} className="cursor-pointer">
                  <LogOut aria-hidden="true" />Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
