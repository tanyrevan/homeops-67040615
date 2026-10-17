import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

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
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-foreground">Welcome!</h1>
      <p className="mt-1 text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user.email}</span>
      </p>
      <Link to="/providers" className="mt-8 block rounded-lg border border-border bg-card p-6 hover:bg-accent">
        <div className="font-medium text-foreground">Providers</div>
        <div className="text-sm text-muted-foreground">Manage your household service providers.</div>
      </Link>
    </AppShell>
  );
}
