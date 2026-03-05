"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });
      if (!result) {
        setError("Erreur inconnue.");
      } else if (result.error) {
        setError("Identifiants invalides.");
      } else if (result.url) {
        router.push(result.url);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("Erreur lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const presetError = searchParams.get("error");

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm ring-1 ring-rer-border">
        <h1 className="text-lg font-semibold text-rer-text">
          Connexion au tableau de bord
        </h1>
        <p className="mt-1 text-sm text-rer-muted">
          Saisissez vos identifiants pour accéder aux articles et à l’espace
          d’administration.
        </p>

        {(error || presetError) && (
          <p className="mt-3 text-sm text-red-600">
            {error || "Identifiants invalides ou session expirée."}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wide text-rer-muted"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-rer-border bg-white px-3 py-2 text-sm text-rer-text shadow-sm focus:border-rer-blue focus:outline-none focus:ring-1 focus:ring-rer-blue"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wide text-rer-muted"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-rer-border bg-white px-3 py-2 text-sm text-rer-text shadow-sm focus:border-rer-blue focus:outline-none focus:ring-1 focus:ring-rer-blue"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-rer-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1e3380] disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>

          <p className="mt-2 text-[11px] text-rer-subtle">
            Comptes de test (en local) : admin@rer.local / relecteur@rer.local
            / auteur@rer.local avec le mot de passe <code>rer2025</code>.
          </p>
        </form>
      </div>
    </div>
  );
}

