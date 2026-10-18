import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/upcoming")({
  beforeLoad: () => { throw redirect({ to: "/providers", replace: true }); },
  head: () => ({ meta: [
    { title: "Upcoming expenses — HomeOps" },
    { name: "description", content: "Manage future household expenses in the unified Expenses workspace." },
    { property: "og:title", content: "Upcoming expenses — HomeOps" },
    { property: "og:description", content: "Manage future household expenses in the unified Expenses workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});
