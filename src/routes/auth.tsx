import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log in — HomeOps" },
      { name: "description", content: "Log in or sign up to HomeOps. Keep your household running smoothly." },
      { property: "og:title", content: "Log in — HomeOps" },
      { property: "og:description", content: "Keep your household running smoothly." },
    ],
  }),
  component: AuthPage,
});

function friendly(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match. Please try again.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("already registered")) return "An account with this email already exists. Try logging in instead.";
  if (m.includes("password")) return "Please choose a stronger password (at least 6 characters).";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  return "Something went wrong. Please try again.";
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(friendly(error.message));
      navigate({ to: "/home", replace: true });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/home` },
      });
      setBusy(false);
      if (error) return setError(friendly(error.message));
      if (data.user && data.user.identities?.length === 0)
        return setError("An account with this email already exists. Try logging in instead.");
      if (data.session) return navigate({ to: "/home", replace: true });
      setInfo("Account created! Check your email to confirm, then log in.");
      setMode("login");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-center text-3xl font-bold text-primary">HomeOps</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Keep your household running smoothly.</p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className={`rounded px-3 py-2 text-sm font-medium ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Password</span>
            <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-ring" />
          </label>
          {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {info && <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">{info}</p>}
          <button type="submit" disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {busy ? "Please wait…" : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
