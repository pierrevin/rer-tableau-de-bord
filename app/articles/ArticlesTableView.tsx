 "use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ArticleSummary = {
  id: string;
  titre: string;
  chapo: string | null;
  lienPhoto: string | null;
  legendePhoto: string | null;
  auteur: { prenom: string; nom: string } | null;
  mutuelle: { nom: string } | null;
  rubrique: { libelle: string } | null;
  format: { libelle: string } | null;
  etat: { libelle: string } | null;
};

type ArticlesTableViewProps = {
  initialArticles: ArticleSummary[];
  total: number;
  initialPage: number;
  pageSize: number;
  q: string;
  etatSlug: string;
  mutuelleId: string;
  rubriqueId?: string;
  formatId?: string;
  since?: string;
  from?: string;
  to?: string;
};

export function ArticlesTableView({
  initialArticles,
  total,
  initialPage,
  pageSize,
  q,
  etatSlug,
  mutuelleId,
  rubriqueId = "",
  formatId = "",
  since = "",
  from = "",
  to = "",
}: ArticlesTableViewProps) {
  const [articles, setArticles] = useState<ArticleSummary[]>(initialArticles);
  const [hasMore, setHasMore] = useState(initialArticles.length < total);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef(initialPage);

  // Réinitialiser la liste et la pagination quand les filtres / la recherche changent
  useEffect(() => {
    setArticles(initialArticles);
    setHasMore(initialArticles.length < total);
    currentPageRef.current = initialPage;
  }, [initialArticles, total, initialPage]);

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(pageSize));
    if (q) params.set("q", q);
    if (etatSlug) params.set("etat", etatSlug);
    if (mutuelleId) params.set("mutuelleId", mutuelleId);
    if (rubriqueId) params.set("rubriqueId", rubriqueId);
    if (formatId) params.set("formatId", formatId);
    if (since) params.set("since", since);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/articles?${params.toString()}`;
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = currentPageRef.current + 1;
    try {
      const res = await fetch(buildUrl(nextPage));
      if (!res.ok) {
        setHasMore(false);
        return;
      }
      const data = await res.json();
      const newArticles: ArticleSummary[] = data.articles ?? [];

      setArticles((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const merged = [
          ...prev,
          ...newArticles.filter((a) => !existingIds.has(a.id)),
        ];
        if (merged.length >= data.total) {
          setHasMore(false);
        }
        return merged;
      });
      currentPageRef.current = nextPage;
      if (!newArticles.length) {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!articles.length) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 bg-white shadow-sm ring-1 ring-slate-200">
          <tbody>
            <tr>
              <td className="px-3 py-6 text-center text-sm text-slate-500">
                Aucun article ne correspond à ces critères. Essayez
                d&apos;élargir votre recherche ou de modifier les filtres.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 bg-white shadow-sm ring-1 ring-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Photo
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Titre
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Auteur
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Mutuelle
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Rubrique
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Format
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                État
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 align-top">
                  {article.lienPhoto ? (
                    <div className="h-14 w-14 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                      <img
                        src={article.lienPhoto}
                        alt={article.legendePhoto || article.titre}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-md border border-dashed border-slate-200 bg-slate-50" />
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-slate-900 align-top">
                  <Link
                    href={`/articles/${article.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {article.titre}
                  </Link>
                  {article.chapo && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {article.chapo}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-slate-700">
                  {article.auteur
                    ? `${article.auteur.prenom} ${article.auteur.nom}`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-sm text-slate-700">
                  {article.mutuelle?.nom || "—"}
                </td>
                <td className="px-3 py-2 text-sm text-slate-700">
                  {article.rubrique?.libelle || "—"}
                </td>
                <td className="px-3 py-2 text-sm text-slate-700">
                  {article.format?.libelle || "—"}
                </td>
                <td className="px-3 py-2 text-sm text-slate-700">
                  {article.etat?.libelle || "—"}
                </td>
                <td className="px-3 py-2 text-right text-sm">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/articles/${article.id}`}
                      className="text-xs font-medium text-slate-700 hover:text-slate-900"
                    >
                      Voir
                    </Link>
                    <Link
                      href={`/articles/${article.id}/edit`}
                      className="text-xs font-medium text-slate-700 hover:text-slate-900"
                    >
                      Corriger
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div ref={sentinelRef} className="h-8">
        {loadingMore && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Chargement…
          </p>
        )}
        {!hasMore && articles.length < total && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Tous les articles chargés.
          </p>
        )}
      </div>
    </>
  );
}

