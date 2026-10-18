# 16 Olive Road browser branding

Spec: update browser tab titles, favicon, and site metadata from "HomeOps" to
"16 Olive Road". No application functionality, database, routes, calculations,
tests, or user data changes. In-app visible UI text (navigation brand, page
headings) intentionally left unchanged.

## Changes

- All route `head()` titles: "X — HomeOps" → "X — 16 Olive Road".
- Login page (`src/routes/auth.tsx`) tab title is exactly "16 Olive Road".
- Root default title/og:title (`src/routes/__root.tsx`) is "16 Olive Road".
- Index title: "16 Olive Road — Household operations tracker".
- Descriptions mentioning HomeOps updated to 16 Olive Road.
- Favicon: new `public/favicon.svg` — capital serif "O", dark lettering on an
  ivory background, matching the classic black/white/ivory theme. Referenced
  from `__root.tsx` head links; old `public/favicon.ico` (Lovable default)
  deleted.

## Verification

- `rg "HomeOps" src/routes` shows only in-app UI headings (intentional).
- Full test suite and build run after the change.
