"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getEtatBadgeClasses,
  getFormatBadgeClasses,
  getRubriqueBadgeClasses,
} from "../ArticlesCardsExplorer";

type Article = {
  id: string;
  titre: string;
  chapo: string | null;
  contenu: string;
  lienPhoto: string | null;
  legendePhoto: string | null;
  postRs: string | null;
  dateDepot: string | null;
  datePublication: string | null;
  createdAt: string;
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
    ])
      .then(([a, s]) => {
        setArticle(a ?? null);
        setSession(s ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const canEdit =
    session?.user?.role === "admin" || session?.user?.role === "relecteur";

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!article) return <div className="p-6">Article introuvable.</div>;

  const metaRubriqueFormat =
    article.rubrique || article.format
      ? [
          article.rubrique?.libelle,
          article.format?.libelle,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/articles"
          className="text-sm font-medium text-rer-blue hover:underline"
        >
          ← Retour à la liste
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {canEdit && (
            <Link
              href={`/articles/${id}/edit`}
              className="inline-flex items-center rounded-full border border-rer-border bg-white px-3 py-1.5 text-xs font-medium text-rer-text shadow-sm hover:bg-rer-app/60"
            >
              Corriger
            </Link>
          )}
          <a
            href={`/api/articles/${id}/export?format=txt`}
            className="inline-flex items-center rounded-md border border-rer-border bg-white px-2 py-1 text-[11px] font-medium text-rer-text hover:bg-rer-app/60"
          >
            TXT
          </a>
          <a
            href={`/api/articles/${id}/export?format=html`}
            className="inline-flex items-center rounded-md border border-rer-border bg-white px-2 py-1 text-[11px] font-medium text-rer-text hover:bg-rer-app/60"
          >
            HTML
          </a>
          <a
            href={`/api/articles/${id}/export?format=word`}
            className="inline-flex items-center rounded-md border border-rer-border bg-white px-2 py-1 text-[11px] font-medium text-rer-text hover:bg-rer-app/60"
          >
            Word
          </a>
        </div>
      </div>

      <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-rer-border">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-rer-border pb-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-rer-muted">
              {metaRubriqueFormat ?? "Article"}
            </p>
            <h1 className="text-2xl font-extrabold text-rer-text">
              {article.titre}
            </h1>
            <p className="text-xs text-rer-muted">
              {article.etat && (
                <span
                  className={getEtatBadgeClasses(article.etat.slug, false)}
                >
                  {article.etat.libelle}
                </span>
              )}
              {article.auteur &&
                ` ${article.auteur.prenom} ${article.auteur.nom}`}
              {article.mutuelle && ` · ${article.mutuelle.nom}`}
              {(() => {
                const d =
                  article.datePublication ??
                  article.dateDepot ??
                  article.createdAt;
                if (!d) return null;
                return (
                  <span>
                    {" · Publié le "}
                    {new Date(d).toLocaleDateString("fr-FR")}
                  </span>
                );
              })()}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs">
            <div className="flex flex-wrap items-center gap-1">
              {article.format && (
                <span
                  className={getFormatBadgeClasses(article.format.libelle)}
                >
                  {article.format.libelle}
                </span>
              )}
              {article.rubrique && (
                <span
                  className={getRubriqueBadgeClasses(
                    article.rubrique.libelle
                  )}
                >
                  {article.rubrique.libelle}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-5 text-sm text-rer-text">
          {article.lienPhoto && (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-md border border-rer-border bg-rer-app">
                <img
                  src={article.lienPhoto}
                  alt={article.legendePhoto || article.titre}
                  className="h-auto w-full max-h-96 object-cover"
                />
              </div>
              {article.legendePhoto && (
                <p className="text-xs text-rer-muted">
                  {article.legendePhoto}
                </p>
              )}
            </div>
          )}

          {article.chapo && (
            <p className="whitespace-pre-wrap text-sm font-semibold text-rer-text">
              {article.chapo}
            </p>
          )}

          {article.contenu && (
            <div className="prose max-w-none text-sm text-rer-text">
              <p className="whitespace-pre-wrap">{article.contenu}</p>
            </div>
          )}

          {article.postRs && (
            <div className="rounded-md bg-rer-app p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rer-muted">
                Post réseaux sociaux
              </p>
              <p className="whitespace-pre-wrap text-sm text-rer-text">
                {article.postRs}
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
