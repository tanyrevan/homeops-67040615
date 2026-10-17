import { describe, expect, it } from "vitest";
import { orderByStar } from "@/lib/stars";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

describe("star ordering", () => {
  it("puts starred providers first, keeping order within each group", () => {
    expect(orderByStar(items, new Set(["c", "a"])).map((i) => i.id)).toEqual(["a", "c", "b", "d"]);
  });
  it("starred only shows just starred providers", () => {
    expect(orderByStar(items, new Set(["d"]), true).map((i) => i.id)).toEqual(["d"]);
  });
});
