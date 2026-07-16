import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAME } from "@/config/constants";
import { useAuthSession } from "@/hooks/useAuthSession";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: `Sign in — ${APP_NAME}` }] }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { session } = useAuthSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "info"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) {
    router.navigate({ to: "/practice" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      setStatus({ kind: "error", message: "Enter a valid email and a password with 6+ characters." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setStatus({ kind: "info", message: "Check your email to confirm your account." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.navigate({ to: "/practice" });
      }
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 px-4 pt-6 pb-6 space-y-6">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back
      </button>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {mode === "sign-in" ? "Welcome back" : "Get started"}
        </p>
        <h1 className="text-3xl font-bold">
          <span className="text-gradient-neon">
            {mode === "sign-in" ? "Sign in" : "Create your account"}
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Save your attempts, track streaks, and sync across devices.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border/60 bg-surface p-4">
        <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Password
          <input
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        {status ? (
          <p
            role={status.kind === "error" ? "alert" : undefined}
            className={
              status.kind === "error"
                ? "rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive"
                : "rounded-lg border border-primary/40 bg-primary/10 p-2.5 text-xs text-primary"
            }
          >
            {status.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-60"
        >
          {busy ? "…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setStatus(null);
        }}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        {mode === "sign-in"
          ? "New here? Create an account →"
          : "Have an account? Sign in →"}
      </button>
    </main>
  );
}
