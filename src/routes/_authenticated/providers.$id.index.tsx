import { createFileRoute, redirect } from "@tanstack/react-router";

// The legacy provider-detail page is retired from the normal user flow.
// The route stays for safety, but anyone reaching it is sent to Expenses.
export const Route = createFileRoute("/_authenticated/providers/$id/")({
  beforeLoad: () => {
    throw redirect({ to: "/providers" });
  },
  head: () => ({
    meta: [
      { title: "Legacy Provider | 16 Olive Road" },
      { name: "description", content: "Every household expense: groceries and service visits." },
      { property: "og:title", content: "Legacy Provider | 16 Olive Road" },
      { property: "og:description", content: "Every household expense: groceries and service visits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
