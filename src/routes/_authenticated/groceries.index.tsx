import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/groceries/")({
  head: () => ({
    meta: [
      { title: "Grocery Expenses — HomeOps" },
      { name: "description", content: "Grocery purchases are part of your unified HomeOps Expenses ledger." },
      { property: "og:title", content: "Grocery Expenses — HomeOps" },
      { property: "og:description", content: "Grocery purchases are part of your unified HomeOps Expenses ledger." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/providers", replace: true });
  },
});
