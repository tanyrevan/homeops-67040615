# Individual expense stars — final documentation update

Requested branch: `docs-expense-stars-update`. The agent workspace reports an internal `edit/…` branch; no branch changes were performed, and the synced branch name could not be independently confirmed.

Scope: documentation only. Do not change application code or database behavior, create migrations, or modify PLAN.md Sections 1–7.

- Inspect the actual implementation and migration before documenting names, columns and relationships; confirm against the live database with read-only queries.
- Update schema.md with the exact individual-star table, columns, primary key, ownership relationship, expense foreign keys, uniqueness, cascade rules and plain-English RLS behavior.
- Retain and clearly distinguish the existing legacy provider-star table and data.
- Update only the Stars row and directly contradictory rows in PLAN.md Section 8; do not rewrite the table.
- Correct only README's outdated starring workflow and directly related table-count statement.
- Document individual Grocery and service/maintenance stars, the Starred control beside Filter, filtering across Upcoming and History, and user-owned database persistence.
- Confirm PLAN.md Sections 1–7 and application/migration files are unchanged.

Inspected sources: `drizzle/migrations/0007_individual_expense_stars.sql`, `src/lib/expense-stars.ts`, the current Expenses page and ExpenseSection, and live star-table columns, constraints and policies. The live database retains both `stars` and `expense_stars`; `expense_stars.user_id` has no foreign key. Grant details are taken from the applied migration because the read-only connection's information_schema grant view returned no rows.

Documentation files changed: schema.md, PLAN.md, README.md, and this prompt log.