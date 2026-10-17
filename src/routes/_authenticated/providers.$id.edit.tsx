import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ProviderForm } from "@/components/ProviderForm";
import { supabase } from "@/integrations/supabase/client";
import { splitServiceType } from "@/lib/provider-validation";
import { providerQuery } from "@/lib/providers-api";

export const Route = createFileRoute("/_authenticated/providers/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Provider — HomeOps" },
      { name: "description", content: "Edit a household service provider." },
      { property: "og:title", content: "Edit Provider — HomeOps" },
      { property: "og:description", content: "Edit a household service provider." },
    ],
  }),
  component: EditProvider,
});

function EditProvider() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery(providerQuery(id));

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Edit Provider</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !p && <p className="text-foreground">This provider wasn't found.</p>}
      {p && (
        <ProviderForm
          initial={{ name: p.name, ...splitServiceType(p.service_type), phone: p.phone_or_contact ?? "", notes: p.notes ?? "" }}
          submitLabel="Save Changes"
          onCancel={() => navigate({ to: "/providers/$id", params: { id } })}
          onSubmit={async (d) => {
            const { error } = await supabase.from("service_providers").update(d).eq("id", id);
            if (error) return "We couldn't save your changes. Please try again.";
            await qc.invalidateQueries({ queryKey: ["providers"] });
            navigate({ to: "/providers/$id", params: { id } });
            return null;
          }}
        />
      )}
    </AppShell>
  );
}
