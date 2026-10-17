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

## Follow-up — Password validation boundary (2026-10-17)

Fix one authentication validation issue only.

During signup, I entered a password that was 6 characters long, but the app showed an error saying the password must be at least 6 characters. A longer password worked.

- Check the frontend password validation and the backend/auth password requirement.
- Make them consistent.
- If the actual minimum is 6 characters, a password with exactly 6 characters should be accepted.
- If the backend requires more than 6 characters, update the displayed error message so it accurately states the real minimum.
- Keep the error message friendly and clear.
- Do not change any other authentication behavior or build any other features.
- Append this follow-up prompt/change to `prompts/authentication.md`.
- After fixing it, verify the minimum-length boundary works correctly.

Change: The hosted signup service accepted an exactly six-character password. Keep the six-character minimum, and stop labeling every password error as a length failure. Report an explicit minimum only when auth returns one; distinguish compromised passwords and character requirements from length errors. No hosted auth settings were changed. Add boundary tests for five, six, and seven characters.
