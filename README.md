# HomeOps

HomeOps is a household expense and operations tracker for grocery purchases and service/maintenance expenses.

**Live app:** https://olive16.lovable.app

Each account owns its records. Shared household access, invitations, and member roles are not implemented.

## Final application

### Navigation

The top navigation is **Dashboard** and **Expenses**, with **Log Out** inside the Settings gear menu. The standalone Groceries, provider-detail, Amount Due, Upcoming and History destinations are retired from the normal user flow; their legacy URLs redirect to Expenses.

### Dashboard

- **Total Spend:** This Month, Last 3 Months, or All Time.
- **Total Amount Due:** outstanding recorded amounts, independent of the Total Spend selector.
- **Summary:** Category, Amount Due, Last Visit, Next Visit.
- **Household Spending (Last 3 Months):** a stacked chart with distinct colors for expense types and a matching legend.

Spending uses actual purchase/visit dates, not creation timestamps, and includes paid and unpaid records. Blank maintenance amounts count as zero; calculations accumulate rounded cents. Last Visit is the latest service visit dated today or earlier, and Next Visit is the earliest future-dated service visit. Grocery visit columns show dashes. Summary/chart categories include Groceries and actual service types, excluding the literal Other category without excluding those expenses from overall totals. Dashboard reads are owner-filtered and paginated.

### Expenses

Expenses is the main ledger for all grocery and service/maintenance transactions. The two record types are combined for display, not merged into one database table.

- **Add Expense:** choose Grocery or a service type. Grocery opens the purchase form. Services use an existing provider or create a provider before recording the expense; custom service types are supported.
- **Upcoming:** future-dated expenses, soonest first, showing date, expense type, amount, and a receipt indicator where applicable. No payment status or Mark Paid action appears here.
- **History:** today/past expenses, newest actual expense date first, with creation time breaking equal-date ties. Shows date, type, amount, receipt indicator, and Paid / Unpaid status. Unpaid records offer **Mark Paid**.
- **Filter:** one compact control contains Status (All / Unpaid / Paid), Type, Month, Year, and Clear filters. Status applies only to History; the other filters apply to both sections.
- Cards open their own transaction detail pages. Provider/store names are shown on details rather than ledger cards.

Service detail pages use the **Expense Type** as their main heading, followed by labeled Provider, Visit Date, Service Performed, Amount Paid, Payment Status, and Notes. Grocery details use **Grocery** as the heading, with labeled Store, Purchase Date, Amount, Status, and Notes. Receipts appear when attached. Both detail pages retain **Back to Expenses** and a low-profile three-dot menu containing **Edit Expense** and **Delete Expense**, with confirmation required before deletion.

The stranger-test fix standardized this hierarchy after a tester found provider names and service descriptions inconsistently used as titles. Existing records and stored type values were preserved. Stored `A/C` or `Air Conditioner` types display as **Aircon**.

### Paid / Unpaid and scheduling

- Service expenses use the existing `maintenance_visits.paid` boolean.
- Grocery expenses use `grocery_expenses.reimbursed` internally, but display **Paid / Unpaid**.
- Paid is restrained green; Unpaid is restrained red. Status is explicit, never inferred from the amount.
- Mark Paid sets the appropriate existing boolean, keeps the record, refreshes the ledger and Dashboard due queries, and shows a success or failure message.
- Scheduling uses future `purchase_date` / `visit_date` records for Upcoming and today/past records for History, using the local calendar date.
- `next_service_date` remains in the database for backward compatibility but is not used by the scheduling interface or written by the current expense forms.

### Starred service providers

Service providers can still be starred/unstarred. The Expenses options menu opens the low-profile **Starred service providers** panel, whose provider selection filters the ledger. Grocery transactions cannot be starred. The `stars` junction table enforces one star per user/provider pair; starring uses a duplicate-ignoring upsert.

### Validation, receipts, and privacy

- Email/password signup, login, and logout; six-character frontend password minimum and friendly errors. The form handles confirmation-email responses without assuming the hosted confirmation setting.
- Signed-in pages redirect unauthenticated users to `/auth`; owner-only database RLS and private storage policies enforce isolation separately from navigation.
- Provider creation requires a name and service type; Other requires custom service text.
- Grocery forms require purchase date, store, and a nonnegative amount (zero is valid), with optional notes and receipt.
- Service forms require visit date and service description; amount is optional and nonnegative, with optional notes and receipt.
- Both expense types support JPEG, PNG, HEIC, and HEIF receipt photos up to 10 MiB. Files are private under account-specific folders and viewed using one-hour signed links. HEIC/HEIF display depends on browser support.
- Logout cancels queries and clears the query cache.

### Theme and retained data

The final style is classic **black / white / ivory**, with restrained controls and distinct chart category colors. Green is reserved for Paid status, not used as a general accent.

Monthly grocery budgets were **cut from the final user-facing product**. The `budgets` table, policies, and historical rows remain. Grocery `category`, maintenance `next_service_date`, and provider records were also preserved despite removal from prominent UI workflows.

## Routes

`<id>` below represents an actual record identifier.

| URL | Final purpose |
|---|---|
| `/` | Redirect to Dashboard or authentication |
| `/auth` | Login/signup |
| `/home` | Dashboard |
| `/providers` | Unified Expenses ledger |
| `/providers/new` | Add Expense type/provider selection |
| `/providers/<id>/visits/new` | Service expense form used by Add Expense |
| `/visits/<id>` and `/visits/<id>/edit` | Service transaction details and edit |
| `/groceries/new` | Grocery purchase form |
| `/groceries/<id>` and `/groceries/<id>/edit` | Grocery transaction details and edit |
| `/groceries`, `/providers/<id>`, `/attention`, `/upcoming`, `/maintenance` | Legacy redirects to Expenses |
| `/providers/<id>/edit` | Retained provider edit route; not a top-level workflow |

Signed-in routes use the pathless `_authenticated` group with SSR disabled and a client-side session gate. That group is not part of public URLs; database RLS still protects record access.

## Technologies

Based on the inspected `package.json` declarations:

| Technology | Use |
|---|---|
| React 19 / TypeScript | Typed interface |
| TanStack Start / Router / Query | Application framework, file-based routes, reads and query caching |
| Vite 8 / Tailwind CSS 4 | Development/build tooling and styling |
| Radix UI and local UI components / Lucide | Controls, dialogs and icons |
| Recharts | Stacked household spending chart |
| Zod and shared validation helpers | Validation; product forms use local React state |
| Lovable Cloud | Authentication, PostgreSQL with RLS, and private receipt storage |
| Lovable hosting | Published application |
| GitHub | Source control, branches, history and pull-request review |
| Vitest / jsdom / Testing Library | Automated tests and test utilities |
| ESLint / Prettier | Linting and formatting |

The configured Vite tooling targets Cloudflare through Nitro. Drizzle tooling is installed for database migration history; its schema file is not a complete model of the live database.

## Running locally

Clone the repository using its actual GitHub repository URL and open its directory. Use a current Node.js version supported by Vite; `package.json` declares no engine requirement. Bun is supported by the checked-in lockfile.

```sh
bun install
bun run dev
```

Alternatively, use `npm install` and `npm run dev`. Open the local URL printed by Vite; the Lovable sandbox uses `http://localhost:8080`.

Local operation needs the project's configured Lovable Cloud backend, tables, signup trigger, owner-only policies, and private receipt bucket. Browser configuration uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; use provided project configuration and never commit private credentials or privileged browser keys. Installing packages alone does not provision a backend.

Application SQL history lives in `drizzle/migrations/`; `drizzle/schema.ts` is intentionally blank. The Drizzle configuration references `LOVABLE_DB_MIGRATION_URL`, but no migration script is declared. Receipt bucket provisioning is separate from the SQL storage policies.

| Command | Action |
|---|---|
| `bun run dev` | Vite development server |
| `bun run build` | Production build |
| `bun run build:dev` | Development-mode build |
| `bun run preview` | Preview built application |
| `bun run test` | Full Vitest run |
| `bun run test:watch` | Vitest watch mode |
| `bun run lint` | ESLint |
| `bun run format` | Prettier; rewrites files |

The same scripts work through npm. There is no declared start, deploy, migration, or typecheck script.

## Automated tests

```sh
bun run test
bunx vitest run src/test/data-isolation.test.ts
bunx vitest run src/test/dashboard-grocery-total.test.ts
```

Verified on **October 18, 2026: 116 tests passed across 16 files**. Coverage includes password/provider/visit/grocery validation, ownership filtering, monthly and household financial calculations, expense date ordering and section filtering, settlement updates, stars, legacy routing, and service detail reads. Budget calculation tests remain even though the budget interface was cut.

The two required assignment tests retain red/green evidence:

- `tests/data-isolation-evidence.md`: fake-user provider ownership check using the application helper; not a live two-account RLS test.
- `tests/dashboard-total-evidence.md`: shared monthly grocery math verifies $100.25 + $45.25 = $145.50, excludes another month, uses purchase date and ignores reimbursement. It tests calculation logic, not rendered text. Historical test counts in evidence describe those earlier runs, not the current suite.

The suite does not constitute a hosted authentication-settings check, live database/security integration suite, or full browser end-to-end suite. The latest expense-detail change has query regression coverage; signed-in receipt/edit/delete-confirmation browser checks remain pending a test session.

## Data model and project organization

Six application tables remain: `users`, `service_providers`, `maintenance_visits`, `grocery_expenses`, `stars`, and `budgets`. See **schema.md** for the live columns, constraints, relationships, policies, triggers, indexes, and receipt storage configuration.

- `src/routes/`: auth, Dashboard, ledger, add/edit/detail pages and legacy redirects.
- `src/components/`: shell, forms, compact filters, ledger sections and status controls.
- `src/lib/`: queries, validation, ownership, sorting, receipt and financial helpers.
- `src/test/`: automated tests; `tests/`: assignment red/green evidence.
- `prompts/`: original feature instructions and follow-ups, including final workflow, stranger-test detail fix and documentation update.
- `PLAN.md`: original Sections 1–7 and final Plan vs. Reality in Section 8.
- `AGENTS.md`: implementation conventions; `drizzle/migrations/`: SQL history.

## Known limitations

- No shared-household invitations, roles or staff permissions; identified during stranger testing as future work.
- No password-reset or general account-settings workflow; the gear menu currently contains Log Out only.
- USD display only, with no currency selection/conversion.
- Receipt cleanup is best-effort. Provider cascades do not delete receipt files; the bucket has no backend MIME allowlist, and frontend metadata validation is not file-content inspection.
- Some detail-query failures may appear as missing records rather than distinct read errors. Date helpers check input shape; database date columns provide additional calendar validation.
- Mark Paid explicitly refreshes Dashboard queries; other expense edit/delete flows primarily invalidate their own query groups and should not be assumed to provide the same immediate aggregate refresh.
