"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Article = {
  id: string;
  titre: string;
  chapo: string | null;
  contenu: string;
  lienPhoto: string | null;
  legendePhoto: string | null;
  postRs: string | null;
  dateDepot: string | null;
  auteur: { prenom: string; nom: string };
  mutuelle: { nom: string } | null;
  rubrique: { libelle: string } | null;
  format: { libelle: string } | null;
  etat: { libelle: string; slug: string } | null;
};

type Session = { user?: { role?: string } } | null;

export default function ArticleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/articles/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/auth/session").then((r) => r.json()),
    ]).then(([a, s]) => {
      setArticle(a ?? null);
      setSession(s ?? null);
    }).finally(() => setLoading(false));
  }, [id]);

  const canEdit = session?.user?.role === "admin" || session?.user?.role === "relecteur";

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!article) return <div className="p-6">Article introuvable.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{article.titre}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/articles" className="text-blue-600 hover:underline">
            ← Liste
          </Link>
          {canEdit && (
            <Link
              href={`/articles/${id}/edit`}
              className="px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 text-sm"
            >
              Corriger
            </Link>
          )}
          <a
            href={`/api/articles/${id}/export?format=txt`}
            className="px-2 py-1.5 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
          >
            TXT
          </a>
          <a
            href={`/api/articles/${id}/export?format=html`}
            className="px-2 py-1.5 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
          >
            HTML
          </a>
          <a
            href={`/api/articles/${id}/export?format=word`}
            className="px-2 py-1.5 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
          >
            Word
          </a>
        </div>
      </div>

      {article.etat && (
        <p className="text-sm text-gray-500 mb-2">État : {article.etat.libelle}</p>
      )}
      <p className="text-sm text-gray-600 mb-4">
        Auteur : {article.auteur.prenom} {article.auteur.nom}
        {article.mutuelle && ` · ${article.mutuelle.nom}`}
        {article.rubrique && ` · ${article.rubrique.libelle}`}
        {article.format && ` · ${article.format.libelle}`}
        {article.dateDepot && ` · Déposé le ${new Date(article.dateDepot).toLocaleDateString("fr-FR")}`}
      </p>

      {article.lienPhoto && (
        <div className="mb-6">
          <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50">
            <img
              src={article.lienPhoto}
              alt={article.legendePhoto || article.titre}
              className="h-auto w-full max-h-96 object-cover"
            />
          </div>
          {article.legendePhoto && (
            <p className="mt-2 text-xs text-gray-500">{article.legendePhoto}</p>
          )}
        </div>
      )}

      {article.chapo && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="font-medium text-gray-700">Chapô</p>
          <p className="whitespace-pre-wrap">{article.chapo}</p>
        </div>
      )}

      <div className="prose max-w-none mb-6">
        <p className="whitespace-pre-wrap">{article.contenu}</p>
      </div>

      {article.legendePhoto && (
        <p className="text-sm text-gray-500 mb-2">Légende photo : {article.legendePhoto}</p>
      )}
      {article.postRs && (
        <div className="p-3 bg-gray-100 rounded">
          <p className="font-medium text-gray-700">Post réseaux sociaux</p>
          <p className="whitespace-pre-wrap text-sm">{article.postRs}</p>
        </div>
      )}
    </div>
  );
}
