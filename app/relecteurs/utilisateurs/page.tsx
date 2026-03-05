"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  role: string;
  auteurId: string | null;
};

type Auteur = {
  id: string;
  prenom: string;
  nom: string;
  mutuelleId: string | null;
};

type Mutuelle = {
  id: string;
  nom: string;
};

type DataResponse = {
  users: User[];
  auteurs: Auteur[];
  mutuelles: Mutuelle[];
};

const ROLES = ["admin", "relecteur", "auteur", "lecteur"];

export default function AdminUsersPage() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("auteur");
  const [newAuteurId, setNewAuteurId] = useState<string | "">("");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) {
          throw new Error("Erreur de chargement");
        }
        const json = (await res.json()) as DataResponse;
        setData(json);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const refresh = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return;
      const json = (await res.json()) as DataResponse;
      setData(json);
    } catch {
      // silencieux
    }
  };

  const handleCreate = async () => {
    if (!newEmail.trim()) return;
    setSavingId("new");
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          role: newRole,
          auteurId: newAuteurId || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur lors de la création");
      }
      setNewEmail("");
      setNewRole("auteur");
      setNewAuteurId("");
      await refresh();
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création");
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (user: User, patch: Partial<User>) => {
    setSavingId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur lors de la mise à jour");
      }
      await refresh();
    } catch (e: any) {
      setError(e.message || "Erreur lors de la mise à jour");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Supprimer l’utilisateur ${user.email} ?`)) return;
    setSavingId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur lors de la suppression");
      }
      await refresh();
    } catch (e: any) {
      setError(e.message || "Erreur lors de la suppression");
    } finally {
      setSavingId(null);
    }
  };

  const auteurLabel = (id: string | null) => {
    if (!id || !data) return "—";
    const a = data.auteurs.find((x) => x.id === id);
    if (!a) return "—";
    const m = data.mutuelles.find((m) => m.id === a.mutuelleId);
    return m ? `${a.prenom} ${a.nom} (${m.nom})` : `${a.prenom} ${a.nom}`;
  };

  if (loading) {
    return (
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-rer-border">
        <h1 className="text-lg font-semibold text-rer-text">
          Gestion des utilisateurs
        </h1>
        <p className="text-sm text-rer-muted">Chargement…</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-rer-border">
        <h1 className="text-lg font-semibold text-rer-text">
          Gestion des utilisateurs
        </h1>
        <p className="text-sm text-red-600">
          {error || "Impossible de charger les données."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-rer-border">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-rer-text">
          Utilisateurs & rôles
        </h1>
        <p className="text-sm text-rer-muted">
          Créer, modifier et supprimer les comptes, définir les rôles et
          rattacher les auteurs pour les fonctionnalités Mes articles.
        </p>
      </header>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="space-y-2 rounded-md bg-rer-app p-3 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-rer-muted">
          Nouvel utilisateur
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            placeholder="email@exemple.org"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="h-8 min-w-[200px] rounded border border-rer-border bg-white px-2 text-sm"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="h-8 rounded border border-rer-border bg-white px-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={newAuteurId}
            onChange={(e) => setNewAuteurId(e.target.value)}
            className="h-8 min-w-[220px] rounded border border-rer-border bg-white px-2 text-sm"
          >
            <option value="">Auteur (optionnel)…</option>
            {data.auteurs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.prenom} {a.nom}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCreate}
            disabled={savingId === "new"}
            className="inline-flex items-center rounded-full bg-rer-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e3380] disabled:opacity-60"
          >
            {savingId === "new" ? "Création…" : "Ajouter"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-rer-border text-sm">
          <thead className="bg-rer-app text-xs font-semibold uppercase tracking-wide text-rer-muted">
            <tr>
              <th className="px-2 py-2 text-left">Email</th>
              <th className="px-2 py-2 text-left">Rôle</th>
              <th className="px-2 py-2 text-left">Auteur rattaché</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rer-border bg-white">
            {data.users.map((u) => (
              <tr key={u.id} className="hover:bg-rer-app/60">
                <td className="px-2 py-1.5 align-top">
                  <input
                    type="email"
                    defaultValue={u.email}
                    onBlur={(e) =>
                      e.target.value !== u.email &&
                      handleUpdate(u, { email: e.target.value })
                    }
                    className="w-full rounded border border-transparent px-1 py-0.5 text-sm hover:border-rer-border focus:border-rer-blue focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5 align-top">
                  <select
                    defaultValue={u.role}
                    onChange={(e) =>
                      e.target.value !== u.role &&
                      handleUpdate(u, { role: e.target.value })
                    }
                    className="h-8 rounded border border-rer-border bg-white px-2 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5 align-top">
                  <select
                    defaultValue={u.auteurId || ""}
                    onChange={(e) =>
                      handleUpdate(u, { auteurId: e.target.value || null })
                    }
                    className="h-8 w-full rounded border border-rer-border bg-white px-2 text-xs"
                  >
                    <option value="">—</option>
                    {data.auteurs.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.prenom} {a.nom}
                      </option>
                    ))}
                  </select>
                  <p className="mt-0.5 text-[11px] text-rer-muted">
                    {auteurLabel(u.auteurId)}
                  </p>
                </td>
                <td className="px-2 py-1.5 text-right align-top">
                  <button
                    type="button"
                    disabled={savingId === u.id}
                    onClick={() => handleDelete(u)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

