# Prompt: Feature 1 — Authentication

Build ONLY Feature 1 for HomeOps: user authentication. Use PLAN.md as source of truth; do not modify it. Do not build later features.

## Requirements
1. Sign up with email + password.
2. Log in with email + password.
3. Log out.
4. Stay logged in after refresh.
5. Redirect to the authenticated HomeOps area after login.
6. Redirect logged-out users to the login page when accessing the authenticated area.
7. Clear, friendly error messages for invalid login/signup.

## Database
- Public `users` table: `id uuid PK` (matches auth user id), `email text`, `created_at timestamptz`.
- Exactly one row auto-created on signup (trigger).
- RLS enabled; a logged-in user can only read their own row.

## UI
- Logged out: HomeOps name, "Keep your household running smoothly.", email, password, Sign Up and Log In options, friendly validation.
- Logged in: HomeOps header, welcome, user email, Log Out button, "Your HomeOps dashboard will appear here."
- Clean, mobile-friendly, simple.

## Out of scope
Service providers, maintenance visits, grocery expenses, CRUD, stars, search/filter/sort, dashboard stats/charts, receipt uploads, upcoming maintenance, grocery budgets.
