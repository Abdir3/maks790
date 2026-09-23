import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Logg inn — MAKS790" },
      {
        name: "description",
        content: "Logg inn for å lage nye eksamenscaser og beholde historikken din.",
      },
      { property: "og:title", content: "Logg inn — MAKS790" },
      {
        property: "og:description",
        content: "Logg inn for å lage nye eksamenscaser og beholde historikken din.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        setMessage("Kontoen er opprettet. Du kan logge inn nå.");
        setMode("in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        void navigate({ to: "/" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Noe gikk galt. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">MAKS790</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {mode === "in" ? "Logg inn" : "Opprett konto"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Innlogging brukes til å lage nye caser og huske hvilke du har hatt.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passord</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Et øyeblikk…" : mode === "in" ? "Logg inn" : "Opprett konto"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-5 text-sm text-muted-foreground underline underline-offset-4"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "Har du ingen konto? Opprett en" : "Har du konto? Logg inn"}
        </button>
        <div className="mt-8">
          <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
            Tilbake til forsiden
          </Link>
        </div>
      </div>
    </main>
  );
}
