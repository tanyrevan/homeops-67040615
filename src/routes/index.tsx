import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeOps — Household operations tracker" },
      { name: "description", content: "Keep your household running smoothly with HomeOps." },
      { property: "og:title", content: "HomeOps — Household operations tracker" },
      { property: "og:description", content: "Keep your household running smoothly with HomeOps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/home" : "/auth", replace: true });
    });
  }, [navigate]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-4xl font-bold text-primary">HomeOps</h1>
      <p className="mt-2 text-muted-foreground">Household operations tracker</p>
    </div>
  );
}
