"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Article = {
  id: string;
  titre: string;
  chapo: string | null;
  contenu: string;
  legendePhoto: string | null;
  postRs: string | null;
  etatId: string | null;
  mutuelleId: string | null;
  rubriqueId: string | null;
  formatId: string | null;
  historiques: {
    id: string;
    createdAt: string;
    etat: { libelle: string } | null;
    user: { email: string } | null;
  }[];
};

type Referentiels = {
  mutuelles: { id: string; nom: string }[];
  rubriques: { id: string; libelle: string }[];
  formats: { id: string; libelle: string }[];
  etats: { id: string; slug: string; libelle: string }[];
};

export default function ArticleEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [ref, setRef] = useState<Referentiels | null>(null);
  const [session, setSession] = useState<{ user?: { role?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [titre, setTitre] = useState("");
  const [chapo, setChapo] = useState("");
  const [contenu, setContenu] = useState("");
  const [etatId, setEtatId] = useState("");
  const [mutuelleId, setMutuelleId] = useState("");
  const [rubriqueId, setRubriqueId] = useState("");
  const [formatId, setFormatId] = useState("");
  const [legendePhoto, setLegendePhoto] = useState("");
  const [postRs, setPostRs] = useState("");

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/articles/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/referentiels").then((r) => r.json()),
      fetch("/api/auth/session").then((r) => r.json()),
    ]).then(([a, r, s]) => {
      setArticle(a ?? null);
      setRef(r ?? null);
      setSession(s ?? null);
      if (a) {
        setTitre(a.titre);
        setChapo(a.chapo ?? "");
        setContenu(a.contenu);
        setEtatId(a.etatId ?? "");
        setMutuelleId(a.mutuelleId ?? "");
        setRubriqueId(a.rubriqueId ?? "");
        setFormatId(a.formatId ?? "");
        setLegendePhoto(a.legendePhoto ?? "");
        setPostRs(a.postRs ?? "");
      }
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const canEdit = session?.user?.role === "admin" || session?.user?.role === "relecteur";

  useEffect(() => {
    if (!loading && (!session?.user || !canEdit)) {
      router.replace(`/articles/${id}`);
    }
  }, [loading, session, canEdit, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre,
          chapo: chapo || null,
          contenu,
          etatId: etatId || null,
          mutuelleId: mutuelleId || null,
          rubriqueId: rubriqueId || null,
          formatId: formatId || null,
          legendePhoto: legendePhoto || null,
          postRs: postRs || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticle(updated);
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erreur lors de l’enregistrement.");
      }
    } catch {
      alert("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !article || !ref) {
    return <div className="p-6">Chargement…</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Éditer l’article</h1>
        <Link href={`/articles/${id}`} className="text-blue-600 hover:underline">
          ← Retour à l’article
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Titre *</label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Chapô</label>
          <textarea
            value={chapo}
            onChange={(e) => setChapo(e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contenu *</label>
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            required
            rows={12}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">État</label>
          <select
            value={etatId}
            onChange={(e) => setEtatId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">—</option>
            {ref.etats.map((e) => (
              <option key={e.id} value={e.id}>
                {e.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mutuelle</label>
          <select
            value={mutuelleId}
            onChange={(e) => setMutuelleId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">—</option>
            {ref.mutuelles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rubrique</label>
          <select
            value={rubriqueId}
            onChange={(e) => setRubriqueId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">—</option>
            {ref.rubriques.map((r) => (
              <option key={r.id} value={r.id}>
                {r.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Format</label>
          <select
            value={formatId}
            onChange={(e) => setFormatId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">—</option>
            {ref.formats.map((f) => (
              <option key={f.id} value={f.id}>
                {f.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Légende photo</label>
          <input
            type="text"
            value={legendePhoto}
            onChange={(e) => setLegendePhoto(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Post réseaux sociaux</label>
          <textarea
            value={postRs}
            onChange={(e) => setPostRs(e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <section className="mt-10 border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">Historique des changements d’état</h2>
        {article.historiques.length === 0 ? (
          <p className="text-gray-500">Aucun changement d’état enregistré.</p>
        ) : (
          <ul className="space-y-2">
            {article.historiques.map((h) => (
              <li key={h.id} className="text-sm flex gap-2">
                <span className="text-gray-500">
                  {new Date(h.createdAt).toLocaleString("fr-FR")}
                </span>
                <span>{h.etat?.libelle ?? "—"}</span>
                {h.user?.email && (
                  <span className="text-gray-500">par {h.user.email}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
