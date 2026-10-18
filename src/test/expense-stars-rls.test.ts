import postgres from "postgres";
import { expect, it } from "vitest";

const connection = process.env['SUPABASE_DB_URL'];

it.skipIf(!connection)("enforces actual database ownership, target validation, uniqueness and deletion for both expense kinds", async () => {
  if (!connection) return;
  const sql = postgres(connection, { max: 1, prepare: false });
  const owner = "dff063f9-b828-4a99-a341-c913a8a46111";
  const other = "dff063f9-b828-4a99-a341-c913a8a46112";
  const rollback = new Error("rollback successful test fixtures");
  try {
    await sql.begin(async (tx) => {
      await tx`insert into public.users(id) values (${owner}), (${other})`;
      const providers = await tx`insert into public.service_providers(user_id,name,service_type) values (${owner},'QA owner','Gardener'), (${other},'QA other','Gardener') returning id,user_id`;
      const ownerProvider = providers.find((p) => p['user_id'] === owner)?.['id'];
      const otherProvider = providers.find((p) => p['user_id'] === other)?.['id'];
      if (!ownerProvider || !otherProvider) throw new Error("Missing fixture providers");
      const visits = await tx`insert into public.maintenance_visits(user_id,service_provider_id,visit_date,service_performed) values (${owner},${ownerProvider},'2026-10-18','QA'), (${other},${otherProvider},'2026-10-18','QA') returning id,user_id`;
      const groceries = await tx`insert into public.grocery_expenses(user_id,purchase_date,store,amount) values (${owner},'2026-10-18','QA',1), (${other},'2026-10-18','QA',1) returning id,user_id`;
      await tx`select set_config('request.jwt.claim.sub', ${owner}, true)`;
      await tx.unsafe("SET LOCAL ROLE authenticated");
      for (const [column, rows] of [["visit_id", visits], ["grocery_id", groceries]] as const) {
        const ownId = rows.find((r) => r['user_id'] === owner)?.['id'];
        const otherId = rows.find((r) => r['user_id'] === other)?.['id'];
        if (!ownId || !otherId) throw new Error("Missing expense fixtures");
        await tx`insert into public.expense_stars(user_id,${tx(column)}) values (${owner},${ownId})`;
        await expect(tx.savepoint(async (sp) => { await sp`insert into public.expense_stars(user_id,${sp(column)}) values (${owner},${otherId})`; })).rejects.toMatchObject({ code: "42501" });
        await expect(tx.savepoint(async (sp) => { await sp`insert into public.expense_stars(user_id,${sp(column)}) values (${other},${otherId})`; })).rejects.toMatchObject({ code: "42501" });
        await expect(tx.savepoint(async (sp) => { await sp`insert into public.expense_stars(user_id,${sp(column)}) values (${owner},${ownId})`; })).rejects.toMatchObject({ code: "23505" });
      }
      const owned = await tx`select id from public.expense_stars where user_id=${owner}`;
      expect(owned).toHaveLength(2);
      await tx`select set_config('request.jwt.claim.sub', ${other}, true)`;
      expect(await tx`select id from public.expense_stars where user_id=${owner}`).toHaveLength(0);
      expect(await tx`delete from public.expense_stars where user_id=${owner} returning id`).toHaveLength(0);
      await tx`select set_config('request.jwt.claim.sub', ${owner}, true)`;
      expect(await tx`delete from public.expense_stars where user_id=${owner} returning id`).toHaveLength(2);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally { await sql.end(); }
}, 30000);