"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import RichArticleEditor from "../../components/RichArticleEditor";

type Referentiels = {
  auteurs: { id: string; prenom: string; nom: string }[];
  mutuelles: { id: string; nom: string }[];
  rubriques: { id: string; libelle: string }[];
  formats: { id: string; libelle: string; signesReference: number | null }[];
  etats: { id: string; slug: string; libelle: string }[];
};

type ImportWordResponse = {
  titre?: string;
  chapo?: string;
  contenu: string;
};

export default function DepotPage() {
  const [ref, setRef] = useState<Referentiels | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titre, setTitre] = useState("");
  const [chapo, setChapo] = useState("");
  const [contenuJson, setContenuJson] = useState<unknown | null>(null);
  const [contenuHtml, setContenuHtml] = useState("");
  const [auteurId, setAuteurId] = useState("");
  const [mutuelleId, setMutuelleId] = useState("");
  const [rubriqueId, setRubriqueId] = useState("");
  const [formatId, setFormatId] = useState("");
  const [legendePhoto, setLegendePhoto] = useState("");
  const [postRs, setPostRs] = useState("");

  useEffect(() => {
    fetch("/api/referentiels")
      .then((r) => r.json())
      .then((data) => {
        setRef(data);
        if (data.auteurs?.length && !auteurId) setAuteurId(data.auteurs[0].id);
      })
      .catch(() => setRef(null))
      .finally(() => setLoading(false));
  }, []);

  const handleImportWord = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import-word", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erreur lors de l’import.");
        return;
      }
      const data: ImportWordResponse = await res.json();
      if (data.titre != null) setTitre(data.titre);
      if (data.chapo != null) setChapo(data.chapo);
      setContenuJson(null);
      setContenuHtml(data.contenu ?? "");
    } catch {
      alert("Erreur lors de l’import.");
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auteurId) {
      alert("Veuillez sélectionner un auteur.");
      return;
    }
    const html = contenuHtml.trim();
    if (!html) {
      alert("Merci de saisir le contenu de l’article.");
      return;
    }
    setSubmitStatus("sending");
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre,
          chapo: chapo || undefined,
          contenuHtml: html,
          contenuJson,
          auteurId,
          mutuelleId: mutuelleId || undefined,
          rubriqueId: rubriqueId || undefined,
          formatId: formatId || undefined,
          legendePhoto: legendePhoto || undefined,
          postRs: postRs || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSubmitStatus("error");
        alert(err.error || "Erreur lors de l’envoi.");
        return;
      }
      setSubmitStatus("ok");
      setTitre("");
      setChapo("");
      setContenu("");
      setLegendePhoto("");
      setPostRs("");
    } catch {
      setSubmitStatus("error");
      alert("Erreur réseau.");
    }
  };

  if (loading || !ref) {
    return (
      <div className="p-6">
        <p>Chargement des données…</p>
      </div>
    );
  }

  const signesRef = ref.formats.find((f) => f.id === formatId)?.signesReference;
  const plainFromHtml = contenuHtml.replace(/<[^>]+>/g, " ");
  const signesCount = (plainFromHtml + titre + chapo).replace(/\s/g, "").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Nouvel article</h1>
        <Link href="/articles" className="text-blue-600 hover:underline">
          ← Liste des articles
        </Link>
      </div>

      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          onClick={handleImportWord}
          disabled={importing}
          className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50"
        >
          {importing ? "Import en cours…" : "Importer un Word"}
        </button>
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
          <RichArticleEditor
            initialHtml={contenuHtml}
            onChange={({ json, html }) => {
              setContenuJson(json);
              setContenuHtml(html);
            }}
          />
          {signesRef != null && (
            <p className="text-sm text-gray-500 mt-1">
              Signes : {signesCount} {signesRef ? `(réf. ${signesRef})` : ""}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Auteur *</label>
          <select
            value={auteurId}
            onChange={(e) => setAuteurId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          >
            {ref.auteurs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.prenom} {a.nom}
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
                {f.signesReference != null ? ` (${f.signesReference} signes)` : ""}
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
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitStatus === "sending"}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitStatus === "sending" ? "Envoi…" : "Créer l’article"}
          </button>
          {submitStatus === "ok" && (
            <span className="text-green-600">Article déposé (état « À relire »).</span>
          )}
          {submitStatus === "error" && (
            <span className="text-red-600">Erreur lors de l’envoi.</span>
          )}
        </div>
      </form>
    </div>
  );
}
