import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/maintenance")({
  beforeLoad: () => { throw redirect({ to: "/providers", replace: true }); },
  head: () => ({ meta: [
    { title: "Expense history | 16 Olive Road" },
    { name: "description", content: "Review household expense history in the unified Expenses workspace." },
    { property: "og:title", content: "Expense history | 16 Olive Road" },
    { property: "og:description", content: "Review household expense history in the unified Expenses workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});
