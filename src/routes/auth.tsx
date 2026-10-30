import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { validatePracticeSearch } from "@/lib/practice-navigation";

export const Route = createFileRoute("/auth")({
  validateSearch: validatePracticeSearch,
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
  const navigate = Route.useNavigate();
  const practiceSearch = Route.useSearch();
  const { mode: practiceMode } = practiceSearch;
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"error" | "success">("error");
  const submitting = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (ready && user && !busy) void navigate({ to: "/", search: practiceSearch, replace: true });
  }, [ready, user, busy, navigate, practiceSearch]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "up") {
        const confirmationUrl = new URL("/", window.location.origin);
        for (const [key, value] of Object.entries(practiceSearch))
          confirmationUrl.searchParams.set(key, String(value));
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: confirmationUrl.toString() },
        });
        if (!mounted.current) return;
        if (error) throw error;
        if (data.session) {
          await navigate({
            to: "/",
            search: practiceSearch,
            replace: true,
          });
        } else {
          setMessageKind("success");
          setMessage(
            "Sjekk e-posten din for en bekreftelseslenke før du logger inn. Har du allerede en konto, kan du bruke innloggingen nedenfor.",
          );
          setMode("in");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (!mounted.current) return;
        if (error) throw error;
        await navigate({
          to: "/",
          search: practiceSearch,
          replace: true,
        });
      }
    } catch {
      if (!mounted.current) return;
      setMessageKind("error");
      setMessage(
        mode === "in"
          ? "Kunne ikke logge inn. Kontroller e-post og passord, og prøv igjen. Hvis du nettopp opprettet konto, bekreft e-postadressen først."
          : "Kunne ikke opprette konto. Kontroller opplysningene dine og prøv igjen.",
      );
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
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
          {practiceMode
            ? `Logg inn for å lage ${practiceMode === "quick" ? "en kort klinisk case" : "en lang eksamenscase"}. Valget ditt følger med videre.`
            : "Logg inn for å lage nye caser og hente casene du har laget tidligere."}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Svarutkast lagres bare på denne enheten.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={busy}
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
              disabled={busy}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {message && (
            <p
              role={messageKind === "error" ? "alert" : "status"}
              className={`text-sm ${messageKind === "error" ? "text-destructive" : "text-foreground"}`}
            >
              {message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Et øyeblikk…" : mode === "in" ? "Logg inn" : "Opprett konto"}
          </Button>
        </form>
        <button
          type="button"
          disabled={busy}
          className="mt-5 text-sm text-muted-foreground underline underline-offset-4"
          onClick={() => {
            setMessage(null);
            setMode(mode === "in" ? "up" : "in");
          }}
        >
          {mode === "in" ? "Har du ingen konto? Opprett en" : "Har du konto? Logg inn"}
        </button>
        <div className="mt-8 flex flex-col items-start gap-4">
          <Link
            to="/"
            search={{ library: true }}
            className="text-sm text-foreground underline underline-offset-4"
          >
            Se et eksempel uten å logge inn
          </Link>
          <Link
            to="/"
            search={{}}
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Tilbake til forsiden
          </Link>
        </div>
      </div>
    </main>
  );
}
