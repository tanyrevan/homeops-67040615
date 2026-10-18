# HomeOps — Database Schema

Rechecked against the live Lovable Cloud database on October 18, 2026. Final interface simplification did not remove tables or legacy fields.

## Overview

HomeOps has seven application tables in the `public` schema:

- `users`
- `service_providers`
- `maintenance_visits`
- `grocery_expenses`
- `stars`
- `budgets`
- `expense_stars`

Authentication accounts are managed separately by Lovable Cloud. Receipt files are stored in the private `receipts` storage bucket.

All seven application tables have row-level security (RLS) enabled. Each account owns its records; there is no shared-household membership model.

## Column notation

- Required means `NOT NULL`.
- `—` means no database default.
- `timestamptz` means timestamp with time zone.
- Amounts use PostgreSQL `numeric` without a declared precision/scale.
- Monetary values are displayed as USD by the application; tables do not contain a currency column.

## 1. users

Application account rows, created by the authentication signup trigger.

| Column | Type | Required | Default |
|---|---|---|---|
| id | uuid | Yes | — |
| email | text | No | — |
| created_at | timestamptz | Yes | `now()` |

Constraints:

- Primary key: `id`.
- No database foreign key from `public.users.id` to the managed authentication table.
- No unique or nonblank constraint on `email` in this application table.

The authentication user's ID is copied into `public.users.id` by the signup trigger.

## 2. service_providers

Household service providers belonging to an account.

| Column | Type | Required | Default |
|---|---|---|---|
| id | uuid | Yes | `gen_random_uuid()` |
| user_id | uuid | Yes | `auth.uid()` |
| name | text | Yes | — |
| service_type | text | Yes | — |
| phone_or_contact | text | No | — |
| notes | text | No | — |
| created_at | timestamptz | Yes | `now()` |

Constraints:

- Primary key: `id`.
- Foreign key: `user_id → public.users.id`, `ON DELETE CASCADE`.
- `length(btrim(name)) > 0`.
- `length(btrim(service_type)) > 0`.

Service types are stored as text, not a database enum. The form displays Gardener, Jacuzzi, Aircon, Electrician, and Other; Other requires a custom service type. Legacy stored `A/C` and `Air Conditioner` values display as Aircon without migrating records.

## 3. maintenance_visits

Maintenance visits linked to a provider.

| Column | Type | Required | Default |
|---|---|---|---|
| id | uuid | Yes | `gen_random_uuid()` |
| user_id | uuid | Yes | `auth.uid()` |
| service_provider_id | uuid | Yes | — |
| visit_date | date | Yes | — |
| service_performed | text | Yes | — |
| amount_paid | numeric | No | — |
| notes | text | No | — |
| next_service_date | date | No | — |
| receipt_url | text | No | — |
| created_at | timestamptz | Yes | `now()` |
| paid | boolean | Yes | `false` |

Constraints:

- Primary key: `id`.
- Foreign key: `user_id → public.users.id`, `ON DELETE CASCADE`.
- Foreign key: `service_provider_id → public.service_providers.id`, `ON DELETE CASCADE`.
- `length(btrim(service_performed)) > 0`.
- `amount_paid IS NULL OR amount_paid >= 0`.

`paid` is an explicit status, independent of `amount_paid`. A blank amount is permitted. No database constraint requires the next service date to follow the visit date.

`next_service_date` is retained for backward compatibility but is no longer used by the scheduling interface. Upcoming/History grouping uses actual `visit_date` and `purchase_date` values.

`receipt_url` stores a storage object path, not a permanent public URL.

## 4. grocery_expenses

Grocery purchases belonging to an account.

| Column | Type | Required | Default |
|---|---|---|---|
| id | uuid | Yes | `gen_random_uuid()` |
| user_id | uuid | Yes | `auth.uid()` |
| purchase_date | date | Yes | — |
| store | text | Yes | — |
| amount | numeric | Yes | — |
| category | text | No | — |
| notes | text | No | — |
| receipt_url | text | No | — |
| created_at | timestamptz | Yes | `now()` |
| reimbursed | boolean | Yes | `false` |

Constraints:

- Primary key: `id`.
- Foreign key: `user_id → public.users.id`, `ON DELETE CASCADE`.
- `length(btrim(store)) > 0`.
- `amount >= 0`; zero is allowed.

`reimbursed` is an explicit status, independent of the amount. Categories are nullable text, not a database enum. `receipt_url` stores a storage object path.

The interface displays `reimbursed` as Paid/Unpaid. The `category` column and existing values remain stored even though category is no longer shown in the grocery forms.

## 5. stars

A legacy junction table recording starred providers. The table and its existing rows remain in the database, but provider starring is no longer the Expenses UI workflow; individual transactions use `expense_stars` instead.

| Column | Type | Required | Default |
|---|---|---|---|
| id | uuid | Yes | `gen_random_uuid()` |
| user_id | uuid | Yes | `auth.uid()` |
| service_provider_id | uuid | Yes | — |
| created_at | timestamptz | Yes | `now()` |

Constraints:

- Primary key: `id`.
- Foreign key: `user_id → public.users.id`, `ON DELETE CASCADE`.
- Foreign key: `service_provider_id → public.service_providers.id`, `ON DELETE CASCADE`.
- Unique: `(user_id, service_provider_id)`.

The unique constraint prevents duplicate stars for the same user and provider. Retained legacy helpers use a duplicate-ignoring insert/upsert when starring and delete the row when unstarring; the final Expenses UI does not use these helpers.

## 6. budgets

Monthly grocery budgets belonging to an account.

| Column | Type | Required | Default |
|---|---|---|---|
| id | uuid | Yes | `gen_random_uuid()` |
| user_id | uuid | Yes | `auth.uid()` |
| month | date | Yes | — |
| amount | numeric | Yes | — |
| created_at | timestamptz | Yes | `now()` |
| updated_at | timestamptz | Yes | `now()` |

Constraints:

- Primary key: `id`.
- Foreign key: `user_id → public.users.id`, `ON DELETE CASCADE`.
- Unique: `(user_id, month)`.
- `EXTRACT(day FROM month) = 1`.
- `amount >= 0`; a zero budget is permitted.

The original budget implementation supported current-month setting/editing. Budget controls were cut from the final user-facing product; this table, its constraints, update trigger, policies and historical rows remain preserved. There is no budget-delete policy.

## 7. expense_stars

Final, persistent stars for individual Grocery purchases and service/maintenance visits, introduced by `0007_individual_expense_stars.sql` and rechecked against the live database on October 18, 2026.

| Column | Type | Required | Default |
|---|---|---|---|
| id | uuid | Yes | `gen_random_uuid()` |
| user_id | uuid | Yes | `auth.uid()` |
| visit_id | uuid | No | — |
| grocery_id | uuid | No | — |
| created_at | timestamptz | Yes | `now()` |

Constraints:

- Primary key: `id` (`expense_stars_pkey`).
- Ownership: `user_id` stores the authenticated account UUID; there is **no foreign key** on this column to `public.users` or the authentication table.
- Foreign key: `visit_id → public.maintenance_visits.id`, `ON DELETE CASCADE`.
- Foreign key: `grocery_id → public.grocery_expenses.id`, `ON DELETE CASCADE`.
- `expense_stars_one_expense`: `num_nonnulls(visit_id, grocery_id) = 1`; exactly one expense reference must be present, never both or neither.
- Unique: `(user_id, visit_id)` and `(user_id, grocery_id)`; one star per user per individual transaction.

RLS allows signed-in users to read and delete only their own stars. Inserting requires their own `user_id` and a referenced visit or grocery purchase that they also own. No UPDATE policy exists. The migration grants SELECT, INSERT and DELETE to `authenticated`, ALL to `service_role`, and no access to `anon`.

The final UI reads owner-scoped stars in pages of 500 and uses duplicate-ignoring upserts for starring and owner/transaction-scoped deletion for unstarring. Stars persist in the database, not browser storage. Starring one service expense never stars other visits from the same provider. The Starred button beside Filter limits both Upcoming and History to starred transactions, combines with the existing filters and preserves ordering.

## Relationships and cascade behavior

- One application user owns many providers, visits, grocery expenses, legacy provider stars, budgets, and individual expense stars; expense-star ownership is enforced by RLS rather than a user foreign key.
- One provider has many maintenance visits.
- Legacy `stars` connect users to providers, with one star per user/provider pair; `expense_stars` connect an owner to one visit or grocery purchase.
- Budgets have one row per user/calendar month.
- Deleting an application user cascades through the existing user foreign keys; `expense_stars` has no direct user cascade, but deleting its referenced expense cascades its star rows.
- Deleting a provider cascades to its visits and legacy provider stars; those visit deletions also cascade to their individual expense stars.
- Deleting a grocery purchase or maintenance visit cascades to its individual expense stars.
- Database cascades do not delete receipt files from storage.

## Row-level security

All policies below apply to the `authenticated` role.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| users | Own row: `auth.uid() = id` | No client policy | No client policy | No client policy |
| service_providers | Own rows | Own rows | Own rows; ownership retained | Own rows |
| maintenance_visits | Own rows | Own rows and owned provider | Own rows and owned provider | Own rows |
| grocery_expenses | Own rows | Own rows | Own rows; ownership retained | Own rows |
| stars | Own rows | Own rows and owned provider | No policy | Own rows |
| budgets | Own rows | Own rows | Own rows; ownership retained | No policy |
| expense_stars | Own rows | Own rows and owned visit or grocery expense | No policy | Own rows |

For owner-scoped tables, ownership is `auth.uid() = user_id`.

Visit INSERT/UPDATE and legacy provider-star INSERT policies additionally check that the referenced provider belongs to the signed-in user. Individual expense-star INSERT policies check ownership of the referenced visit or grocery expense instead.

There are no anonymous application-table policies. The original six tables were previously documented with SELECT/INSERT/UPDATE/DELETE privileges for both `anon` and `authenticated`; `expense_stars` instead has the narrower grants listed above. RLS restricts which rows and operations are accessible, and missing policies deny ordinary client access even where a table-level privilege exists.

RLS is enabled but not forced on these tables. Privileged backend operations are outside the ordinary client-policy model.

The provider list also applies `filterOwnedRecords` in application code as a defense-in-depth ownership check. That check does not replace RLS.

## Functions and triggers

### public.handle_new_user()

- Returns `trigger`.
- PL/pgSQL, `SECURITY DEFINER`, search path `public`.
- Inserts the new authentication user's ID and email into `public.users`.
- Uses `ON CONFLICT (id) DO NOTHING`.
- Called by `on_auth_user_created`, an AFTER INSERT trigger on the managed authentication users table.

### public.budgets_touch_updated_at()

- Returns `trigger`.
- PL/pgSQL, not security-definer, search path `public`.
- Sets `NEW.updated_at = now()`.
- Called by `budgets_updated_at`, a BEFORE UPDATE trigger on `public.budgets`.

## Indexes

Every table has a primary-key index on `id`. Additional indexes are:

| Table | Index | Definition |
|---|---|---|
| service_providers | service_providers_user_id_idx | `(user_id)` |
| maintenance_visits | maintenance_visits_user_idx | `(user_id)` |
| maintenance_visits | maintenance_visits_provider_idx | `(service_provider_id, visit_date DESC)` |
| maintenance_visits | maintenance_visits_unpaid_idx | `(user_id) WHERE paid = false` |
| grocery_expenses | grocery_expenses_user_date_idx | `(user_id, purchase_date DESC)` |
| grocery_expenses | grocery_expenses_unreimbursed_idx | `(user_id) WHERE reimbursed = false` |
| stars | stars_user_provider_unique | Unique `(user_id, service_provider_id)` |
| budgets | budgets_user_month_unique | Unique `(user_id, month)` |
| expense_stars | expense_stars_user_id_visit_id_key | Unique `(user_id, visit_id)` |
| expense_stars | expense_stars_user_id_grocery_id_key | Unique `(user_id, grocery_id)` |

## Receipt storage

The live `receipts` bucket was inspected:

- Visibility: private.
- File-size limit: 10,485,760 bytes (10 MiB).
- Bucket MIME allowlist: not configured (`NULL`).
- Form validation accepts JPEG, PNG, HEIC, and HEIF based on file metadata.
- Object paths: `<user_id>/visits/<uuid>.<extension>` or `<user_id>/groceries/<uuid>.<extension>`.
- `receipt_url` contains this object path.
- Viewing creates a signed URL valid for one hour.

Storage SELECT, INSERT, UPDATE, and DELETE policies require the `receipts` bucket and an initial folder matching the signed-in user's ID.

Individual visit/grocery deletion and receipt replacement attempt storage cleanup. Cleanup errors are not inspected by `removeReceipt`, so success is not guaranteed. Provider deletion cascades visit rows without removing their receipt objects.

## Repository schema history

Application SQL is recorded in `drizzle/migrations/0000_migration.sql` through `0007_individual_expense_stars.sql`. Migration 0007 adds individual expense stars and marks provider stars as legacy in a table comment; it does not remove the provider-star table.

`drizzle/schema.ts` is intentionally blank and is not a complete representation of the live schema. Migration configuration uses `LOVABLE_DB_MIGRATION_URL`. The receipt bucket itself was provisioned separately; the SQL migrations contain storage policies but do not create the bucket.
