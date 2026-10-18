import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ProviderForm } from "@/components/ProviderForm";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/providers/new")({
  head: () => ({
    meta: [
      { title: "Add Provider — HomeOps" },
      { name: "description", content: "Add a household service provider." },
      { property: "og:title", content: "Add Provider — HomeOps" },
      { property: "og:description", content: "Add a household service provider." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewProvider,
});

function NewProvider() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Add Provider</h1>
      <ProviderForm
        initial={{ name: "", serviceChoice: "", customType: "", phone: "", notes: "" }}
        submitLabel="Save Provider"
        onCancel={() => navigate({ to: "/providers" })}
        onSubmit={async (d) => {
          const { data, error } = await supabase.from("service_providers").insert({ ...d, user_id: user.id }).select("id").single();
          if (error) return "We couldn't save this provider. Please try again.";
          await qc.invalidateQueries({ queryKey: ["providers"] });
          navigate({ to: "/providers/$id", params: { id: data.id } });
          return null;
        }}
      />
    </AppShell>
  );
}
