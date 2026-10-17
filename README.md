# HomeOps

HomeOps is a household operations tracker for maintenance visits, service providers, grocery spending, and monthly grocery budgets.

**Live app:** https://olive16.lovable.app

Each account has its own records. Shared household accounts, invitations, and member roles are not implemented.

## Implemented features

### Authentication and privacy

- Email/password signup, login, and logout.
- Six-character frontend password minimum and friendly authentication errors.
- Confirmation-email handling when the authentication service requires confirmation.
- Signed-in pages redirect unauthenticated users to `/auth`.
- Database row-level security limits application records to their owner.
- Provider loading also applies an application-side ownership filter.
- Logout cancels queries and clears the query cache.

### Service providers

- Create, list, view, edit, and confirm-before-delete.
- Required provider name and service type; optional contact and notes.
- Gardener, Jacuzzi, A/C, Electrician, and Other service choices.
- Custom service text is required for Other; Plumber can be entered this way.
- Star/unstar providers and filter to starred providers.
- Default ordering puts starred providers first, newest first within each group.

### Maintenance visits

- Add a visit from a provider page.
- View visit history per provider and across all providers.
- View, edit, and confirm-before-delete visits.
- Required visit date and service description.
- Optional nonnegative amount, notes, next service date, and receipt photo.
- Explicit Paid/Unpaid status, independent of the recorded amount.

### Grocery expenses

- Create, list, view, edit, and confirm-before-delete purchases.
- Required purchase date, store, and nonnegative amount; zero is valid.
- Optional category, notes, and receipt photo.
- Categories: General Groceries, Produce, Meat / Seafood, Dairy, Household, Snacks / Drinks, and Other.
- Other can contain custom text.
- Explicit Reimbursed/Not Reimbursed status.

### Search, filters, and sorting

- Providers: name search, service-type filter, starred-only filter, name or creation-date sorting.
- Maintenance: provider/service text search, payment-status filter, inclusive date range, date or amount sorting.
- Groceries: store search, category/reimbursement filters, inclusive date range, date or amount sorting.
- Controls work together and can be cleared.
- Search/filter/sort runs in the browser over records restricted by database RLS.
- Explicit provider sorts override default star priority.

### Dashboard

The signed-in home page is `/home` and displays:

- Current calendar month's grocery total.
- Current calendar month's maintenance amount total.
- Current calendar month's maintenance visit count.
- Grocery spending for the last six calendar months, including zero-spending months.
- Current month's grocery budget and spending progress.

Totals use purchase/visit dates, not record creation dates. Paid and reimbursed statuses do not exclude records from spending totals. Blank maintenance amounts count as zero. Monetary calculations accumulate rounded cents.

### Upcoming maintenance

Visits with a next service date appear in ascending due-date order:

- Overdue: before today's local calendar date.
- Due Soon: today through seven days ahead, inclusive.
- Upcoming: more than seven days ahead.

Visits without a next service date are excluded. This is a per-visit view; it does not automatically resolve older schedules or keep only the newest schedule per provider.

### Monthly grocery budgets

- Set or edit the current month's budget on the Dashboard.
- One budget per account per month.
- Show spending, remaining amount, overage, and percentage used.
- Progress bar caps at 100%; the displayed percentage can exceed 100%.
- Zero budgets are handled without division by zero.
- Previous monthly rows remain stored.
- No budget deletion or historical-month management interface.

### Needs Attention

A separate page lists unpaid maintenance visits and unreimbursed grocery purchases, with links to their details. It is separate from the Upcoming maintenance view.

### Receipt photos

- Optional receipt attachment for both groceries and maintenance visits.
- Private receipt storage under account-specific folders.
- JPEG, PNG, HEIC, and HEIF accepted by form validation, up to 10 MiB.
- Receipt viewing uses temporary signed links.
- HEIC/HEIF rendering depends on the browser and may require downloading the original.

## Routes

`<id>` below represents an actual record ID, not literal URL text.

| URL | Purpose |
|---|---|
| `/` | Redirect to Dashboard or authentication |
| `/auth` | Login/signup |
| `/home` | Dashboard and current grocery budget |
| `/providers` | Provider list |
| `/providers/new` | Add provider |
| `/providers/<id>` | Provider details and visit history |
| `/providers/<id>/edit` | Edit provider |
| `/providers/<id>/visits/new` | Add visit for provider |
| `/maintenance` | All maintenance history |
| `/visits/<visitId>` | Visit details |
| `/visits/<visitId>/edit` | Edit visit |
| `/groceries` | Grocery list |
| `/groceries/new` | Add purchase |
| `/groceries/<groceryId>` | Purchase details |
| `/groceries/<groceryId>/edit` | Edit purchase |
| `/upcoming` | Due-date groups |
| `/attention` | Unpaid/unreimbursed records |

Signed-in routes live under a pathless `_authenticated` route group with SSR disabled and an authentication check before loading. `_authenticated` is not part of public URLs. Record access remains protected by database RLS, not just the page redirect.

## Technologies

Versions below are declarations from `package.json`, not a claim that every installed package was independently version-checked.

| Technology | Declared version | Use |
|---|---|---|
| React / React DOM | `^19.2.0` | Interface |
| TypeScript | `^5.8.3` | Typed application code |
| TanStack Start | `1.168.60` | Application framework |
| TanStack Router | `1.170.41` | File-based routing |
| TanStack Query | `^5.101.1` | Queries, mutations, caching |
| Vite | `8.1.5` | Development/build tooling |
| Tailwind CSS | `^4.2.1` | Styling |
| Radix UI and local UI components | Multiple packages | Controls and dialogs |
| Recharts | `^2.15.4` | Grocery spending chart |
| Zod | `^3.25.76` | Password/budget validation |
| Lucide React | `^0.575.0` | Icons |
| `@supabase/supabase-js` | `^2.118.0` | Lovable Cloud client |
| Vitest | `^4.1.10` | Automated tests |
| jsdom | `^20.0.3` | Test environment |
| Testing Library React / jest-dom | `^16.0.0` / `^6.6.0` | Test utilities |
| ESLint / Prettier | `^9.32.0` / `^3.7.3` | Linting/formatting |

Lovable Cloud supplies authentication, PostgreSQL with RLS, and file storage. Lovable hosts the published app.

The Lovable Vite configuration uses Nitro with Cloudflare as its default build target and a custom server entry. Drizzle Kit/ORM and the `postgres` package are installed for database tooling. React Hook Form and additional UI packages are also installed, but the product forms inspected use local React state and shared validation helpers rather than a uniform React Hook Form implementation.

## Local development

Clone this repository using its actual repository URL, then open its directory.

Use a current Node.js version supported by the declared Vite version. `package.json` does not declare a Node engine requirement. Bun is supported by the checked-in `bun.lock`.

Install dependencies and start development:

```sh
bun install
bun run dev
```

Alternatively, using npm:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. In the Lovable development sandbox, the app is served at `http://localhost:8080`.

### Backend configuration

A functional local app needs the configured Lovable Cloud backend, including authentication, application tables, RLS policies, signup trigger, and private receipt bucket.

Browser configuration uses:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use the project's provided configuration; do not commit private credentials or place privileged keys in browser code. Installation alone does not provision a fresh backend.

Application SQL migrations are under `drizzle/migrations/`. The Drizzle configuration references `LOVABLE_DB_MIGRATION_URL`, but no migration command is declared in `package.json`, and `drizzle/schema.ts` is intentionally blank. Do not assume schema generation recreates the live database.

The migrations require the managed authentication/storage environment. Receipt bucket creation is separate from the SQL storage policies.

### Available scripts

| Command | Action |
|---|---|
| `bun run dev` | `vite dev` |
| `bun run build` | `vite build` |
| `bun run build:dev` | Development-mode build |
| `bun run preview` | Preview the built application |
| `bun run lint` | ESLint |
| `bun run format` | Prettier; rewrites files |
| `bun run test` | Run Vitest once |
| `bun run test:watch` | Vitest watch mode |

The same scripts can be invoked with npm. There is no declared `start`, `deploy`, migration, or typecheck script.

## Automated tests

Run all tests:

```sh
bun run test
```

Run the two required tests individually:

```sh
bunx vitest run src/test/data-isolation.test.ts
bunx vitest run src/test/dashboard-grocery-total.test.ts
```

The inspected source defines 61 tests across 12 files:

| Test file under `src/test/` | Cases | Main coverage |
|---|---:|---|
| app-routing.test.tsx | 1 | Root route matching |
| password-validation.test.ts | 6 | Password boundaries/error classification |
| provider-validation.test.ts | 6 | Provider form rules |
| visit-validation.test.ts | 7 | Visit validation, receipts, payment status |
| grocery-validation.test.ts | 7 | Grocery validation, categories, reimbursement |
| stars.test.ts | 2 | Star ordering/filtering |
| list-filters.test.ts | 12 | Search/filter/sort combinations |
| dashboard-stats.test.ts | 5 | Monthly totals and chart buckets |
| due-status.test.ts | 7 | Due-date boundaries/grouping |
| budget.test.ts | 6 | Budget validation/progress |
| data-isolation.test.ts | 1 | Provider ownership helper |
| dashboard-grocery-total.test.ts | 1 | Current-month grocery sum |
| **Total** | **61** | |

### Required test scope

The data-isolation test uses two fake users and calls the ownership helper used by provider loading. It verifies that User B receives Provider B and not Provider A. It does not log in real accounts or directly test database RLS.

The Dashboard test calls the same `monthSummary` helper used by the Dashboard. It verifies `$100.25 + $45.25 = $145.50`, excludes a `$300.00` purchase in another month, uses `purchase_date` instead of `created_at`, and ignores reimbursement status. It does not assert the rendered Dashboard text.

Red/green evidence is recorded in:

- `tests/data-isolation-evidence.md`
- `tests/dashboard-total-evidence.md`

The latter records a previous successful full-suite run: 12 files and 61 tests. Tests were not rerun during the October 17, 2026 read-only documentation inspection.

The current suite does not include a live two-account security test, a duplicate-star database integration test, or an end-to-end browser test suite.

## Data model

The six application tables are `users`, `service_providers`, `maintenance_visits`, `grocery_expenses`, `stars`, and `budgets`.

See `schema.md` for columns, relationships, constraints, indexes, RLS behavior, triggers, and receipt storage details.

## Project organization

- `src/routes/`: authentication, Dashboard, lists, details, and edit/add pages.
- `src/components/`: shared shell, forms, filters, status displays, and UI controls.
- `src/lib/`: queries, receipt utilities, validation, ownership, sorting, due dates, and financial calculations.
- `src/test/`: Vitest tests and setup.
- `drizzle/migrations/`: application SQL history.
- `prompts/`: feature instructions and follow-ups.
- `tests/`: required-test red/green evidence.
- `PLAN.md`: original plan and final retrospective.
- `AGENTS.md`: project implementation conventions.

## Known limitations

- Accounts are separate households; no sharing, invitations, roles, or staff permissions.
- No password-reset or account-settings workflow.
- USD display only; no currency selection/conversion.
- Maintenance uses provider/service text search rather than dedicated provider/service-type selectors.
- Budgets can be managed only for the current month.
- Upcoming is per visit and does not automatically resolve obsolete next-service dates.
- Receipt cleanup is best-effort; provider deletion can leave orphaned visit receipt files.
- The private bucket enforces a 10 MiB limit but has no backend MIME allowlist; form checks are not file-content inspection.
- Visit/grocery edits invalidate their own query groups, not the separate Dashboard query; aggregate refresh is not explicitly coordinated.
- Some query failures can appear as missing records or an unset budget rather than a distinct read-error message.
- Date helpers validate input shape; PostgreSQL date columns supply additional calendar validation.

## Plan and prompt history

`PLAN.md` records the original scope. Feature prompts and follow-ups are retained under `prompts/`, including authentication, providers, visits, groceries, payment status, stars, filters, Dashboard, Upcoming, budgets, and the two required tests.

Receipt uploads and budgets were possible cuts in the original plan, but both were implemented. Payment/reimbursement tracking and Needs Attention were added during feature development.
