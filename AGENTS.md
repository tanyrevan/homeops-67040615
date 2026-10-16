<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Signed-in pages live under `src/routes/_authenticated/` (client-only gate redirecting to `/auth`); why: the session is in browser storage, so the server can't check it.
- `public.users` rows are created only by the `handle_new_user` trigger on signup; why: guarantees exactly one row per account.
