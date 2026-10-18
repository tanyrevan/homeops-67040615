import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("drizzle/migrations/0007_individual_expense_stars.sql", "utf8");
describe("expense star database isolation contract", () => {
  it("limits reads and deletion to the authenticated owner", () => {
    expect(migration).toMatch(/FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\)/);
    expect(migration).toMatch(/FOR DELETE TO authenticated USING \(auth\.uid\(\) = user_id\)/);
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).not.toMatch(/GRANT.*TO anon/i);
  });
  it("requires both caller ownership and target expense ownership on insert", () => {
    expect(migration).toContain("auth.uid() = user_id AND");
    expect(migration).toContain("v.id = visit_id AND v.user_id = auth.uid()");
    expect(migration).toContain("g.id = grocery_id AND g.user_id = auth.uid()");
  });
  it("enforces one transaction per star, unique per user, with cascading cleanup", () => {
    expect(migration).toContain("num_nonnulls(visit_id, grocery_id) = 1");
    expect(migration).toContain("UNIQUE (user_id, visit_id)");
    expect(migration).toContain("UNIQUE (user_id, grocery_id)");
    expect(migration).toContain("REFERENCES public.maintenance_visits(id) ON DELETE CASCADE");
    expect(migration).toContain("REFERENCES public.grocery_expenses(id) ON DELETE CASCADE");
  });
});