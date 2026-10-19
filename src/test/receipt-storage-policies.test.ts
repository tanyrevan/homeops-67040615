import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../../drizzle/migrations/0002_create_maintenance_visits.sql", import.meta.url), "utf8");
describe("receipt owner isolation", () => {
  for (const operation of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
    it(`${operation} requires the private receipt bucket and the caller's owner folder`, () => {
      const policy = sql.split(";").find((statement) => statement.includes("ON storage.objects") && statement.includes(`FOR ${operation} `));
      expect(policy).toBeDefined();
      expect(policy).toContain("TO authenticated");
      expect(policy).toContain("bucket_id = 'receipts'");
      expect(policy).toContain("(storage.foldername(name))[1] = auth.uid()::text");
    });
  }
  it("removes only the obsolete nonempty service constraint", () => {
    const migration = readFileSync(new URL("../../drizzle/migrations/0008_allow_optional_service_performed.sql", import.meta.url), "utf8");
    expect(migration.trim()).toBe("ALTER TABLE public.maintenance_visits DROP CONSTRAINT maintenance_visits_service_performed_check;");
  });
});