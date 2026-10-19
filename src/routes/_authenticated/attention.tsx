import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/attention")({
  beforeLoad: () => { throw redirect({ to: "/providers", replace: true }); },
  head: () => ({ meta: [
    { title: "Outstanding expenses | 16 Olive Road" },
    { name: "description", content: "Settle unpaid household expenses in the unified Expenses workspace." },
    { property: "og:title", content: "Outstanding expenses | 16 Olive Road" },
    { property: "og:description", content: "Settle unpaid household expenses in the unified Expenses workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});
