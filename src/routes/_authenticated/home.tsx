import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — HomeOps" },
      { name: "description", content: "Your HomeOps household area." },
      { property: "og:title", content: "Home — HomeOps" },
      { property: "og:description", content: "Your HomeOps household area." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-primary">HomeOps</span>
          <button
            onClick={signOut}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Log Out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-foreground">Welcome!</h1>
        <p className="mt-1 text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </p>
        <div className="mt-8 rounded-lg border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Your HomeOps dashboard will appear here.
        </div>
      </main>
    </div>
  );
}
