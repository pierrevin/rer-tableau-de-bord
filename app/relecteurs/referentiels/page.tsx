"use client";

import { useEffect, useState } from "react";

type Mutuelle = { id: string; nom: string };
type Rubrique = { id: string; libelle: string };
type Format = { id: string; libelle: string; signesReference: number | null };
type Auteur = {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  mutuelleId: string | null;
};

type AuteursResponse = {
  auteurs: Auteur[];
  mutuelles: Mutuelle[];
};

export default function AdminReferentielsPage() {
  const [mutuelles, setMutuelles] = useState<Mutuelle[]>([]);
  const [rubriques, setRubriques] = useState<Rubrique[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [auteurs, setAuteurs] = useState<Auteur[]>([]);
  const [mutuellesForAuteurs, setMutuellesForAuteurs] = useState<Mutuelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [newMutuelleNom, setNewMutuelleNom] = useState("");
  const [newRubriqueLibelle, setNewRubriqueLibelle] = useState("");
  const [newFormatLibelle, setNewFormatLibelle] = useState("");
  const [newFormatSignes, setNewFormatSignes] = useState("");
  const [newAuteurPrenom, setNewAuteurPrenom] = useState("");
  const [newAuteurNom, setNewAuteurNom] = useState("");
  const [newAuteurEmail, setNewAuteurEmail] = useState("");
  const [newAuteurMutuelleId, setNewAuteurMutuelleId] = useState<string | "">("");

  useEffect(() => {
    const run = async () => {
      try {
        const [mRes, rRes, fRes, aRes] = await Promise.all([
          fetch("/api/admin/mutuelles"),
          fetch("/api/admin/rubriques"),
          fetch("/api/admin/formats"),
          fetch("/api/admin/auteurs"),
        ]);
        if (!mRes.ok || !rRes.ok || !fRes.ok || !aRes.ok) {
          throw new Error("Erreur de chargement");
        }
        const m = (await mRes.json()) as Mutuelle[];
        const r = (await rRes.json()) as Rubrique[];
        const f = (await fRes.json()) as Format[];
        const a = (await aRes.json()) as AuteursResponse;
        setMutuelles(m);
        setRubriques(r);
        setFormats(f);
        setAuteurs(a.auteurs);
        setMutuellesForAuteurs(a.mutuelles);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les référentiels.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const refreshMutuelles = async () => {
    const res = await fetch("/api/admin/mutuelles");
    if (!res.ok) return;
    const m = (await res.json()) as Mutuelle[];
    setMutuelles(m);
  };
  const refreshRubriques = async () => {
    const res = await fetch("/api/admin/rubriques");
    if (!res.ok) return;
    const r = (await res.json()) as Rubrique[];
    setRubriques(r);
  };
  const refreshFormats = async () => {
    const res = await fetch("/api/admin/formats");
    if (!res.ok) return;
    const f = (await res.json()) as Format[];
    setFormats(f);
  };
  const refreshAuteurs = async () => {
    const res = await fetch("/api/admin/auteurs");
    if (!res.ok) return;
    const a = (await res.json()) as AuteursResponse;
    setAuteurs(a.auteurs);
    setMutuellesForAuteurs(a.mutuelles);
  };

  const handleError = (e: any, fallback: string) => {
    const msg = e?.message || fallback;
    setError(msg);
  };

  const createMutuelle = async () => {
    if (!newMutuelleNom.trim()) return;
    setSavingKey("mutuelle-new");
    setError(null);
    try {
      const res = await fetch("/api/admin/mutuelles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newMutuelleNom.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur création mutuelle");
      }
      setNewMutuelleNom("");
      await Promise.all([refreshMutuelles(), refreshAuteurs()]);
    } catch (e) {
      handleError(e, "Erreur création mutuelle");
    } finally {
      setSavingKey(null);
    }
  };

  const updateMutuelle = async (m: Mutuelle, nom: string) => {
    if (!nom.trim() || nom === m.nom) return;
    setSavingKey(`mutuelle-${m.id}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/mutuelles/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur mise à jour mutuelle");
      }
      await Promise.all([refreshMutuelles(), refreshAuteurs()]);
    } catch (e) {
      handleError(e, "Erreur mise à jour mutuelle");
    } finally {
      setSavingKey(null);
    }
  };

  const deleteMutuelle = async (m: Mutuelle) => {
    if (!window.confirm(`Supprimer la mutuelle ${m.nom} ?`)) return;
    setSavingKey(`mutuelle-${m.id}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/mutuelles/${m.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur suppression mutuelle");
      }
      await Promise.all([refreshMutuelles(), refreshAuteurs()]);
    } catch (e) {
      handleError(e, "Erreur suppression mutuelle");
    } finally {
      setSavingKey(null);
    }
  };

  const createRubrique = async () => {
    if (!newRubriqueLibelle.trim()) return;
    setSavingKey("rubrique-new");
    setError(null);
    try {
      const res = await fetch("/api/admin/rubriques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libelle: newRubriqueLibelle.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur création rubrique");
      }
      setNewRubriqueLibelle("");
      await refreshRubriques();
    } catch (e) {
      handleError(e, "Erreur création rubrique");
    } finally {
      setSavingKey(null);
    }
  };

  const updateRubrique = async (r: Rubrique, libelle: string) => {
    if (!libelle.trim() || libelle === r.libelle) return;
    setSavingKey(`rubrique-${r.id}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rubriques/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libelle }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur mise à jour rubrique");
      }
      await refreshRubriques();
    } catch (e) {
      handleError(e, "Erreur mise à jour rubrique");
    } finally {
      setSavingKey(null);
    }
  };

  const deleteRubrique = async (r: Rubrique) => {
    if (!window.confirm(`Supprimer la rubrique ${r.libelle} ?`)) return;
    setSavingKey(`rubrique-${r.id}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rubriques/${r.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur suppression rubrique");
      }
      await refreshRubriques();
    } catch (e) {
      handleError(e, "Erreur suppression rubrique");
    } finally {
      setSavingKey(null);
    }
  };

  const createFormat = async () => {
    if (!newFormatLibelle.trim()) return;
    setSavingKey("format-new");
    setError(null);
    try {
      const signes =
        newFormatSignes.trim() === ""
          ? null
          : Number.parseInt(newFormatSignes.trim(), 10) || null;
      const res = await fetch("/api/admin/formats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libelle: newFormatLibelle.trim(),
          signesReference: signes,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur création format");
      }
      setNewFormatLibelle("");
      setNewFormatSignes("");
      await refreshFormats();
    } catch (e) {
      handleError(e, "Erreur création format");
    } finally {
      setSavingKey(null);
    }
  };

  const updateFormat = async (
    f: Format,
    patch: Partial<{ libelle: string; signesReference: number | null }>
  ) => {
    setSavingKey(`format-${f.id}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/formats/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur mise à jour format");
      }
      await refreshFormats();
    } catch (e) {
      handleError(e, "Erreur mise à jour format");
    } finally {
      setSavingKey(null);
    }
  };

  const deleteFormat = async (f: Format) => {
    if (!window.confirm(`Supprimer le format ${f.libelle} ?`)) return;
    setSavingKey(`format-${f.id}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/formats/${f.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur suppression format");
      }
      await refreshFormats();
    } catch (e) {
      handleError(e, "Erreur suppression format");
    } finally {
      setSavingKey(null);
    }
  };

  const createAuteur = async () => {
    if (!newAuteurPrenom.trim() || !newAuteurNom.trim() || !newAuteurMutuelleId) {
      setError("Prénom, nom et mutuelle sont obligatoires pour créer un auteur.");
      return;
    }
    setSavingKey("auteur-new");
    setError(null);
    try {
      const res = await fetch("/api/admin/auteurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: newAuteurPrenom.trim(),
          nom: newAuteurNom.trim(),
          email: newAuteurEmail.trim() || null,
          mutuelleId: newAuteurMutuelleId,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur création auteur");
      }
      setNewAuteurPrenom("");
      setNewAuteurNom("");
      setNewAuteurEmail("");
      setNewAuteurMutuelleId("");
      await refreshAuteurs();
    } catch (e) {
      handleError(e, "Erreur création auteur");
    } finally {
      setSavingKey(null);
    }
  };

  const updateAuteur = async (
    a: Auteur,
    patch: Partial<{ prenom: string; nom: string; email: string | null; mutuelleId: string | null }>
  ) => {
    setSavingKey(`auteur-${a.id}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/auteurs/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur mise à jour auteur");
      }
      await refreshAuteurs();
    } catch (e) {
      handleError(e, "Erreur mise à jour auteur");
    } finally {
      setSavingKey(null);
    }
  };

  const deleteAuteur = async (a: Auteur) => {
    if (!window.confirm(`Supprimer l’auteur ${a.prenom} ${a.nom} ?`)) return;
    setSavingKey(`auteur-${a.id}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/auteurs/${a.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur suppression auteur");
      }
      await refreshAuteurs();
    } catch (e) {
      handleError(e, "Erreur suppression auteur");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-rer-border">
        <h1 className="text-lg font-semibold text-rer-text">
          Référentiels éditoriaux
        </h1>
        <p className="text-sm text-rer-muted">Chargement…</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-rer-border">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-rer-text">
          Référentiels éditoriaux
        </h1>
        <p className="text-sm text-rer-muted">
          Gérer les mutuelles, rubriques, formats et auteurs utilisés dans les
          articles et les filtres.
        </p>
      </header>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mutuelles */}
        <div className="space-y-2 rounded-lg bg-rer-app p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-rer-muted">
            Mutuelles
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="text"
              placeholder="Nom de la mutuelle"
              value={newMutuelleNom}
              onChange={(e) => setNewMutuelleNom(e.target.value)}
              className="h-8 flex-1 min-w-[160px] rounded border border-rer-border bg-white px-2 text-sm"
            />
            <button
              type="button"
              onClick={createMutuelle}
              disabled={savingKey === "mutuelle-new"}
              className="inline-flex items-center rounded-full bg-rer-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e3380] disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded border border-rer-border bg-white p-1 text-sm">
            {mutuelles.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-rer-app/60"
              >
                <input
                  type="text"
                  defaultValue={m.nom}
                  onBlur={(e) => updateMutuelle(m, e.target.value)}
                  className="flex-1 rounded border border-transparent px-1 py-0.5 text-sm hover:border-rer-border focus:border-rer-blue focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => deleteMutuelle(m)}
                  disabled={savingKey === `mutuelle-${m.id}`}
                  className="text-[11px] font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                >
                  Suppr.
                </button>
              </div>
            ))}
            {mutuelles.length === 0 && (
              <p className="px-1 py-0.5 text-xs text-rer-muted">
                Aucune mutuelle pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* Rubriques */}
        <div className="space-y-2 rounded-lg bg-rer-app p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-rer-muted">
            Rubriques
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="text"
              placeholder="Libellé de la rubrique"
              value={newRubriqueLibelle}
              onChange={(e) => setNewRubriqueLibelle(e.target.value)}
              className="h-8 flex-1 min-w-[160px] rounded border border-rer-border bg-white px-2 text-sm"
            />
            <button
              type="button"
              onClick={createRubrique}
              disabled={savingKey === "rubrique-new"}
              className="inline-flex items-center rounded-full bg-rer-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e3380] disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded border border-rer-border bg-white p-1 text-sm">
            {rubriques.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-rer-app/60"
              >
                <input
                  type="text"
                  defaultValue={r.libelle}
                  onBlur={(e) => updateRubrique(r, e.target.value)}
                  className="flex-1 rounded border border-transparent px-1 py-0.5 text-sm hover:border-rer-border focus:border-rer-blue focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => deleteRubrique(r)}
                  disabled={savingKey === `rubrique-${r.id}`}
                  className="text-[11px] font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                >
                  Suppr.
                </button>
              </div>
            ))}
            {rubriques.length === 0 && (
              <p className="px-1 py-0.5 text-xs text-rer-muted">
                Aucune rubrique pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* Formats */}
        <div className="space-y-2 rounded-lg bg-rer-app p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-rer-muted">
            Formats
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="text"
              placeholder="Libellé du format"
              value={newFormatLibelle}
              onChange={(e) => setNewFormatLibelle(e.target.value)}
              className="h-8 flex-1 min-w-[160px] rounded border border-rer-border bg-white px-2 text-sm"
            />
            <input
              type="number"
              min={0}
              placeholder="Signes de réf."
              value={newFormatSignes}
              onChange={(e) => setNewFormatSignes(e.target.value)}
              className="h-8 w-28 rounded border border-rer-border bg-white px-2 text-xs"
            />
            <button
              type="button"
              onClick={createFormat}
              disabled={savingKey === "format-new"}
              className="inline-flex items-center rounded-full bg-rer-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e3380] disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded border border-rer-border bg-white p-1 text-sm">
            {formats.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-rer-app/60"
              >
                <input
                  type="text"
                  defaultValue={f.libelle}
                  onBlur={(e) =>
                    e.target.value !== f.libelle &&
                    updateFormat(f, { libelle: e.target.value })
                  }
                  className="flex-1 rounded border border-transparent px-1 py-0.5 text-sm hover:border-rer-border focus:border-rer-blue focus:outline-none"
                />
                <input
                  type="number"
                  defaultValue={f.signesReference ?? ""}
                  min={0}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    const num =
                      v === "" ? null : Number.parseInt(v, 10) || null;
                    if (num !== f.signesReference) {
                      updateFormat(f, { signesReference: num });
                    }
                  }}
                  className="w-24 rounded border border-rer-border bg-white px-1 py-0.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => deleteFormat(f)}
                  disabled={savingKey === `format-${f.id}`}
                  className="text-[11px] font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                >
                  Suppr.
                </button>
              </div>
            ))}
            {formats.length === 0 && (
              <p className="px-1 py-0.5 text-xs text-rer-muted">
                Aucun format pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* Auteurs */}
        <div className="space-y-2 rounded-lg bg-rer-app p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-rer-muted">
            Auteurs
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="text"
              placeholder="Prénom"
              value={newAuteurPrenom}
              onChange={(e) => setNewAuteurPrenom(e.target.value)}
              className="h-8 w-28 rounded border border-rer-border bg-white px-2 text-sm"
            />
            <input
              type="text"
              placeholder="Nom"
              value={newAuteurNom}
              onChange={(e) => setNewAuteurNom(e.target.value)}
              className="h-8 w-32 rounded border border-rer-border bg-white px-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email (optionnel)"
              value={newAuteurEmail}
              onChange={(e) => setNewAuteurEmail(e.target.value)}
              className="h-8 flex-1 min-w-[160px] rounded border border-rer-border bg-white px-2 text-sm"
            />
            <select
              value={newAuteurMutuelleId}
              onChange={(e) => setNewAuteurMutuelleId(e.target.value)}
              className="h-8 rounded border border-rer-border bg-white px-2 text-xs"
            >
              <option value="">Mutuelle (optionnelle)…</option>
              {mutuellesForAuteurs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={createAuteur}
              disabled={savingKey === "auteur-new"}
              className="inline-flex items-center rounded-full bg-rer-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e3380] disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded border border-rer-border bg-white p-1 text-sm">
            {auteurs.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-2 rounded px-1 py-0.5 hover:bg-rer-app/60"
              >
                <input
                  type="text"
                  defaultValue={a.prenom}
                  onBlur={(e) =>
                    e.target.value !== a.prenom &&
                    updateAuteur(a, { prenom: e.target.value })
                  }
                  className="h-7 w-24 rounded border border-transparent px-1 py-0.5 text-sm hover:border-rer-border focus:border-rer-blue focus:outline-none"
                />
                <input
                  type="text"
                  defaultValue={a.nom}
                  onBlur={(e) =>
                    e.target.value !== a.nom &&
                    updateAuteur(a, { nom: e.target.value })
                  }
                  className="h-7 w-28 rounded border border-transparent px-1 py-0.5 text-sm hover:border-rer-border focus:border-rer-blue focus:outline-none"
                />
                <input
                  type="email"
                  defaultValue={a.email ?? ""}
                  onBlur={(e) =>
                    e.target.value !== (a.email ?? "") &&
                    updateAuteur(a, {
                      email: e.target.value.trim() || null,
                    })
                  }
                  className="h-7 flex-1 min-w-[120px] rounded border border-rer-border bg-white px-1 py-0.5 text-xs"
                />
                <select
                  defaultValue={a.mutuelleId || ""}
                  onChange={(e) =>
                    updateAuteur(a, {
                      mutuelleId: e.target.value || null,
                    })
                  }
                  className="h-7 rounded border border-rer-border bg-white px-1 text-xs"
                >
                  <option value="">—</option>
                  {mutuellesForAuteurs.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => deleteAuteur(a)}
                  disabled={savingKey === `auteur-${a.id}`}
                  className="text-[11px] font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                >
                  Suppr.
                </button>
              </div>
            ))}
            {auteurs.length === 0 && (
              <p className="px-1 py-0.5 text-xs text-rer-muted">
                Aucun auteur pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

