# HomeOps minimal starter

Replace the placeholder home page with a simple centered page showing:

- "HomeOps" (heading)
- "Household operations tracker" (subtitle)

No other features, pages, auth, or backend.

## Technical details
- Rewrite `src/routes/index.tsx`: centered heading + subtitle using semantic tokens; add `head()` with HomeOps title/description/og tags.
- Update `__root.tsx` default meta from "Lovable App" to HomeOps.
- Add a one-line rule to `AGENTS.md` noting the project is a minimal shell awaiting feature specs.
