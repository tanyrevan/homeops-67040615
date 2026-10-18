import postgres from "postgres";
import { expect, it } from "vitest";

const connection = process.env['SUPABASE_DB_URL'];
const sessionJson = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const apiUrl = import.meta.env.VITE_SUPABASE_URL;
const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Uses the preview's authenticated session and temporary foreign-owner fixtures.
// Ordinary local runs without a hosted session skip this integration test.
it.skipIf(!connection || !sessionJson || !apiUrl || !apiKey)("backend denies reading, deleting or creating another owner's expense stars for both transaction kinds", async () => {
  if (!connection || !sessionJson || !apiUrl || !apiKey) return;
  const session = JSON.parse(sessionJson);
  const owner = crypto.randomUUID();
  const sql = postgres(connection, { max: 1, prepare: false });
  const headers = { apikey: apiKey, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", Prefer: "return=representation" };
  try {
    await sql`insert into public.users(id) values (${owner})`;
    const providers = await sql`insert into public.service_providers(user_id,name,service_type) values (${owner},'Temporary isolation QA','Gardener') returning id`;
    const provider = providers[0]?.['id'];
    if (!provider) throw new Error("Missing QA provider");
    const visits = await sql`insert into public.maintenance_visits(user_id,service_provider_id,visit_date,service_performed) values (${owner},${provider},'2026-10-18','QA') returning id`;
    const groceries = await sql`insert into public.grocery_expenses(user_id,purchase_date,store,amount) values (${owner},'2026-10-18','QA',1) returning id`;
    for (const [column, id] of [["visit_id", visits[0]?.['id']], ["grocery_id", groceries[0]?.['id']]]) {
      if (!id || !column) throw new Error("Missing QA transaction");
      await sql`insert into public.expense_stars(user_id,${sql(column)}) values (${owner},${id})`;
      const read = await fetch(`${apiUrl}/rest/v1/expense_stars?user_id=eq.${owner}`, { headers });
      expect(read.status).toBe(200);
      expect(await read.json()).toEqual([]);
      const remove = await fetch(`${apiUrl}/rest/v1/expense_stars?user_id=eq.${owner}`, { method: "DELETE", headers });
      expect(remove.status).toBe(200);
      expect(await remove.json()).toEqual([]);
      for (const userId of [owner, session.user.id]) {
        const insert = await fetch(`${apiUrl}/rest/v1/expense_stars`, { method: "POST", headers, body: JSON.stringify({ user_id: userId, [column]: id }) });
        expect(insert.status).toBe(403);
      }
    }
    expect(await sql`select id from public.expense_stars where user_id=${owner}`).toHaveLength(2);
  } finally {
    await sql`delete from public.maintenance_visits where user_id=${owner}`;
    await sql`delete from public.grocery_expenses where user_id=${owner}`;
    await sql`delete from public.service_providers where user_id=${owner}`;
    await sql`delete from public.users where id=${owner}`;
    await sql.end();
  }
}, 30000);