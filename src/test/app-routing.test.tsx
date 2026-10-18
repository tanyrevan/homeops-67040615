import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { Route as legacyGroceriesRoute } from "@/routes/_authenticated/groceries.index";
import { Route as legacyAttentionRoute } from "@/routes/_authenticated/attention";
import { Route as legacyUpcomingRoute } from "@/routes/_authenticated/upcoming";
import { Route as legacyHistoryRoute } from "@/routes/_authenticated/maintenance";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it.each([
    ["/attention", legacyAttentionRoute],
    ["/upcoming", legacyUpcomingRoute],
    ["/maintenance", legacyHistoryRoute],
  ])("redirects retired %s to Expenses", async (_, route) => {
    let result: unknown;
    try { await route.options.beforeLoad?.({} as never); } catch (error) { result = error; }
    expect(result).toMatchObject({ options: { to: "/providers", replace: true } });
  });
  it("redirects the retired /groceries list to the unified Expenses ledger", async () => {
    const beforeLoad = legacyGroceriesRoute.options.beforeLoad;
    expect(beforeLoad).toBeTypeOf("function");
    let result: unknown;
    try {
      await beforeLoad?.({} as never);
    } catch (error) {
      result = error;
    }
    expect(result).toMatchObject({ options: { to: "/providers", replace: true } });
  });

  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
