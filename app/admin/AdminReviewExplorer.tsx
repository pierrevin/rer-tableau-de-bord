"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getEtatBadgeClasses } from "../articles/ArticlesCardsExplorer";

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
  etat: { libelle: string; slug: string } | null;
  dateDepot: string | null;
  datePublication: string | null;
  createdAt: string;
};

type Etat = {
  id: string;
  slug: string;
  libelle: string;
  ordre: number;
};

type ArticleDetail = {
  id: string;
  titre: string;
  chapo: string | null;
  contenu: string | null;
  lienPhoto: string | null;
  legendePhoto: string | null;
  postRs: string | null;
  dateDepot: string | null;
  datePublication: string | null;
  createdAt: string;
  auteur: { prenom: string; nom: string } | null;
  mutuelle: { nom: string } | null;
  rubrique: { libelle: string } | null;
  format: { libelle: string } | null;
  etat: { libelle: string; slug: string } | null;
  historiques: {
    id: string;
    createdAt: string;
    etat: { libelle: string } | null;
    user: { email: string | null } | null;
    commentaire: string | null;
  }[];
};

type AdminReviewExplorerProps = {
  articles: ArticleSummary[];
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
  initialSelectedId?: string;
  etats: Etat[];
};

function AdminArticlePanel({
  selectedId,
  selectedArticle,
  detail,
  loading,
  error,
  etats,
  onEtatUpdated,
}: {
  selectedId: string;
  selectedArticle: ArticleSummary | null;
  detail: ArticleDetail | null;
  loading: boolean;
  error: string | null;
  etats: Etat[];
  onEtatUpdated: (etatSlug: string | null) => void;
}) {
  const [updatingEtat, setUpdatingEtat] = useState(false);

  const handleChangeEtat = async (targetEtatId: string) => {
    if (!detail || updatingEtat) return;
    setUpdatingEtat(true);
    try {
      const res = await fetch(`/api/articles/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etatId: targetEtatId }),
      });
      if (!res.ok) {
        return;
      }
      const updated = (await res.json()) as ArticleDetail;
      onEtatUpdated(updated.etat?.slug ?? null);
    } finally {
      setUpdatingEtat(false);
    }
  };

  const sortedEtats = [...etats].sort((a, b) => a.ordre - b.ordre);
  const currentSlug = detail?.etat?.slug ?? selectedArticle?.etat?.slug ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-rer-border pb-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rer-muted">
            Mode relecture
          </p>
          {selectedArticle && (
            <h2 className="text-lg font-semibold text-rer-text">
              {selectedArticle.titre}
            </h2>
          )}
          {detail && (
            <p className="text-xs text-rer-muted">
              {detail.auteur &&
                `${detail.auteur.prenom} ${detail.auteur.nom}`}
              {detail.mutuelle && ` · ${detail.mutuelle.nom}`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={`/articles/${selectedId}`}
            className="inline-flex items-center rounded-full border border-rer-border bg-white px-3 py-1.5 text-xs font-medium text-rer-text hover:bg-rer-app/60"
          >
            Ouvrir en pleine page
          </Link>
        </div>
      </div>

      {/* Timeline des états */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {sortedEtats.map((etat) => {
          const isActive = etat.slug === currentSlug;
          return (
            <button
              key={etat.id}
              type="button"
              disabled={updatingEtat}
              onClick={() => handleChangeEtat(etat.id)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                isActive
                  ? "bg-rer-blue text-white"
                  : "bg-rer-app text-rer-text hover:bg-white hover:ring-1 hover:ring-rer-border"
              }`}
            >
              {etat.libelle}
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="mt-2 text-sm text-rer-muted">Chargement…</p>
      )}
      {!loading && error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && detail && (
        <div className="mt-2 flex-1 space-y-4 overflow-y-auto pr-1 text-sm text-rer-text">
          <div className="space-y-1 rounded-md bg-rer-app p-2 text-xs">
            <p className="font-semibold text-rer-muted">
              Historique des états
            </p>
            {detail.historiques.length === 0 ? (
              <p className="text-rer-subtle">
                Aucun changement d’état enregistré.
              </p>
            ) : (
              <ul className="space-y-1">
                {detail.historiques.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-1">
                    <span className="text-[11px] text-rer-subtle">
                      {new Date(h.createdAt).toLocaleDateString("fr-FR")} ·
                    </span>
                    {h.etat && (
                      <span className="text-[11px] font-medium">
                        {h.etat.libelle}
                      </span>
                    )}
                    {h.user?.email && (
                      <span className="text-[11px] text-rer-subtle">
                        par {h.user.email}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {detail.chapo && (
            <p className="whitespace-pre-wrap text-sm font-semibold text-rer-text">
              {detail.chapo}
            </p>
          )}

          {detail.contenu && (
            <div className="prose max-w-none text-sm text-rer-text">
              <p className="whitespace-pre-wrap">{detail.contenu}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminReviewExplorer({
  articles,
  total,
  initialPage,
  pageSize,
  q,
  etatSlug,
  mutuelleId,
  rubriqueId = "",
  formatId = "",
  initialSelectedId,
  since = "",
  from = "",
  to = "",
  etats,
}: AdminReviewExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [visibleArticles, setVisibleArticles] =
    useState<ArticleSummary[]>(articles);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId || (articles[0]?.id ?? null)
  );
  const [detail, setDetail] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(articles.length < total);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef(initialPage);

  useEffect(() => {
    setVisibleArticles(articles);
    setHasMore(articles.length < total);
    currentPageRef.current = initialPage;
    setSelectedId((prev) => {
      if (prev && articles.some((a) => a.id === prev)) {
        return prev;
      }
      return initialSelectedId || (articles[0]?.id ?? null);
    });
  }, [articles, total, initialPage, initialSelectedId]);

  const selectedArticle = useMemo(
    () => visibleArticles.find((a) => a.id === selectedId) || null,
    [visibleArticles, selectedId]
  );

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

      setVisibleArticles((prev) => {
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
    if (!selectedId) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/articles/${selectedId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: ArticleDetail | null) => {
        if (cancelled) return;
        if (!data) {
          setDetail(null);
          setError("Article introuvable ou erreur de chargement.");
        } else {
          setDetail(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
          setError("Erreur lors du chargement de l’article.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const updateUrl = (updates: Record<string, string | null>) => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.set("page", "1");
    const query = params.toString();
    router.replace(`/admin/articles?${query}`, { scroll: false });
  };

  const handleEtatFilterClick = (slug: string | null) => {
    updateUrl({ etat: slug, article: null });
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    updateUrl({ article: id });
  };

  const handleEtatUpdated = (etatSlugUpdated: string | null) => {
    setVisibleArticles((prev) =>
      prev.map((a) =>
        a.id === selectedId
          ? {
              ...a,
              etat: etatSlugUpdated
                ? { ...(a.etat ?? { libelle: etatSlugUpdated }), slug: etatSlugUpdated }
                : a.etat,
            }
          : a
      )
    );
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

  if (!visibleArticles.length) {
    return (
      <p className="rounded-md bg-white px-3 py-6 text-center text-sm text-rer-muted shadow-sm ring-1 ring-rer-border">
        Aucun article ne correspond à ces critères. Essayez d&apos;élargir
        votre recherche ou de modifier les filtres.
      </p>
    );
  }

  const sortedEtats = [...etats].sort((a, b) => a.ordre - b.ordre);

  return (
    <>
      {/* Filtres d’état dédiés relecture */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-rer-muted">
          États
        </span>
        {sortedEtats.map((etat) => (
          <button
            key={etat.id}
            type="button"
            onClick={() => handleEtatFilterClick(etat.slug)}
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
              etat.slug === etatSlug
                ? "bg-rer-blue text-white"
                : "bg-white text-rer-text ring-1 ring-rer-border hover:bg-rer-app"
            }`}
          >
            {etat.libelle}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleEtatFilterClick("a_relire")}
          className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium bg-rer-app text-rer-text hover:bg-white hover:ring-1 hover:ring-rer-border"
        >
          À relire
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
        <div className="max-h-[calc(100vh-140px)] space-y-2 overflow-y-auto pr-1 border-r border-rer-border">
          {visibleArticles.map((article) => {
            const isSelected = article.id === selectedId;
            const ageLabel = (() => {
              const refDate =
                article.datePublication ??
                article.dateDepot ??
                article.createdAt;
              if (!refDate) return "";
              const d = new Date(refDate);
              const diff = Date.now() - d.getTime();
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              if (days <= 0) return "aujourd’hui";
              if (days === 1) return "il y a 1 jour";
              return `il y a ${days} jours`;
            })();

            return (
              <button
                key={article.id}
                type="button"
                onClick={() => handleSelect(article.id)}
                aria-pressed={isSelected}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-rer-blue/5 ring-1 ring-rer-blue"
                    : "bg-white hover:bg-rer-app hover:ring-1 hover:ring-rer-border"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {article.etat && (
                      <span
                        className={getEtatBadgeClasses(article.etat.slug, false)}
                      >
                        {article.etat.libelle}
                      </span>
                    )}
                    <p className="truncate text-sm font-semibold text-rer-text">
                      {article.titre}
                    </p>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-rer-muted">
                    {article.mutuelle?.nom}
                    {article.rubrique && ` · ${article.rubrique.libelle}`}
                    {article.format && ` · ${article.format.libelle}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px] text-rer-subtle">
                  <span>{ageLabel}</span>
                </div>
              </button>
            );
          })}
          <div ref={sentinelRef} className="h-6 lg:h-8" />
        </div>

        <div className="hidden min-h-[260px] flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-rer-border lg:flex">
          {!selectedId && (
            <p className="text-sm text-rer-muted">
              Sélectionnez un article dans la file pour le relire.
            </p>
          )}

          {selectedId && (
            <AdminArticlePanel
              selectedId={selectedId}
              selectedArticle={selectedArticle}
              detail={detail}
              loading={loading}
              error={error}
              etats={etats}
              onEtatUpdated={handleEtatUpdated}
            />
          )}
        </div>
      </div>
    </>
  );
}

