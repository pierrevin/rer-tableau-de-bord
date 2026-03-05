 "use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useArticleShortcuts } from "./useArticleShortcuts";

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
};

type ArticlesExplorerViewProps = {
  articles: ArticleSummary[];
  total: number;
  initialPage: number;
  pageSize: number;
  q: string;
  etatSlug: string;
  mutuelleId: string;
  rubriqueId?: string;
  formatId?: string;
  initialSelectedId?: string;
  since?: string;
  from?: string;
  to?: string;
  showEtat: boolean;
};

export function getEtatBadgeClasses(slug?: string, active?: boolean): string {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium";

  switch (slug) {
    case "a_relire":
      return (
        base +
        " border-[#FACC15]/60 bg-[#FEF9C3] text-[#854D0E]" +
        (active ? " ring-1 ring-[#FACC15]/80" : "")
      );
    case "corrige":
      return (
        base +
        " border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]" +
        (active ? " ring-1 ring-[#93C5FD]" : "")
      );
    case "valide":
      return (
        base +
        " border-transparent bg-[#D1FAE5] text-[#047857]" +
        (active ? " ring-1 ring-[#6EE7B7]" : "")
      );
    case "publie":
      return (
        base +
        " border-[#22C55E] bg-[#16A34A] text-white" +
        (active ? " ring-1 ring-[#4ADE80]" : "")
      );
    default:
      return (
        base +
        " border-rer-border bg-rer-app text-rer-muted" +
        (active ? " ring-1 ring-rer-border" : "")
      );
  }
}

export function getFormatBadgeClasses(libelle?: string): string {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
  if (!libelle) {
    return base + " bg-rer-app text-rer-muted";
  }
  const key = libelle.toLowerCase();

  if (key.includes("brève")) {
    return base + " bg-[#FDF2F8] text-[#BE185D]";
  }
  if (key.includes("dossier")) {
    return base + " bg-[#EEF2FF] text-[#4F46E5]";
  }
  if (key.includes("focus")) {
    return base + " bg-[#FFFBEB] text-[#92400E]";
  }
  if (key.includes("actus") || key.includes("actu")) {
    return base + " bg-[#EFF6FF] text-[#1D4ED8]";
  }
  // Article ou autres formats
  return base + " bg-[#E5E7EB] text-[#111827]";
}

export function getRubriqueBadgeClasses(libelle?: string): string {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
  if (!libelle) {
    return base + " bg-[#4B5563] text-white";
  }
  const key = libelle.toLowerCase();

  if (key.includes("sant")) {
    return base + " bg-[#16A34A] text-white";
  }
  if (key.includes("vie pratique")) {
    return base + " bg-[#EA580C] text-white";
  }
  if (key.includes("société")) {
    return base + " bg-[#DB2777] text-white";
  }
  if (key.includes("produits") || key.includes("services")) {
    return base + " bg-[#0EA5E9] text-white";
  }
  if (key.includes("vie de la mutuelle")) {
    return base + " bg-[#4F46E5] text-white";
  }
  return base + " bg-[#4B5563] text-white";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtmlFromDetail(article: ArticleDetail): string {
  const parts: string[] = [];

  if (article.titre) {
    parts.push(`<h1>${escapeHtml(article.titre)}</h1>`);
  }

  if (article.chapo) {
    parts.push(`<p><strong>Chapô.</strong> ${escapeHtml(article.chapo)}</p>`);
  }

  if (article.contenu) {
    const paragraphs = article.contenu.split(/\n{2,}/g);
    const htmlParagraphs = paragraphs
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("\n");
    if (htmlParagraphs) {
      parts.push(htmlParagraphs);
    }
  }

  if (article.postRs) {
    parts.push(
      `<p><strong>Post réseaux sociaux.</strong> ${escapeHtml(
        article.postRs
      )}</p>`
    );
  }

  return parts.join("\n\n");
}

function buildFormattedTextFromDetail(article: ArticleDetail): string {
  const lines: string[] = [];

  if (article.titre) {
    // Titre simple sans syntaxe Markdown pour un meilleur collage dans Word / Google Docs
    lines.push(article.titre);
    lines.push("");
  }

  if (article.chapo) {
    lines.push("Chapô :");
    lines.push(article.chapo);
    lines.push("");
  }

  if (article.contenu) {
    const paragraphs = article.contenu.split(/\n{2,}/g);
    paragraphs
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .forEach((p) => {
        lines.push(p);
        lines.push("");
      });
  }

  if (article.postRs) {
    lines.push("Post réseaux sociaux :");
    lines.push(article.postRs);
  }

  return lines.join("\n");
}

type ArticleDetailContentProps = {
  selectedId: string;
  selectedArticle: ArticleSummary | null;
  loading: boolean;
  error: string | null;
  detail: ArticleDetail | null;
  showEtat: boolean;
};

function ArticleDetailContent({
  selectedId,
  selectedArticle,
  loading,
  error,
  detail,
  showEtat,
}: ArticleDetailContentProps) {
  const [copyState, setCopyState] = useState<
    "idle" | "html" | "text" | "error"
  >("idle");
  const [imageCopyState, setImageCopyState] = useState<
    "idle" | "copied" | "error"
  >("idle");

  const canCopy = !!detail && !loading && !error;

  const handleCopyHtml = async () => {
    if (!detail || loading || error) return;
    try {
      const html = buildHtmlFromDetail(detail);
      await navigator.clipboard.writeText(html);
      setCopyState("html");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 3000);
    }
  };

  const handleCopyText = async () => {
    if (!detail || loading || error) return;
    try {
      const text = buildFormattedTextFromDetail(detail);
      await navigator.clipboard.writeText(text);
      setCopyState("text");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 3000);
    }
  };

  const handleCopyImageUrl = async () => {
    if (!detail?.lienPhoto || loading || error) return;
    try {
      await navigator.clipboard.writeText(detail.lienPhoto);
      setImageCopyState("copied");
      window.setTimeout(() => setImageCopyState("idle"), 2000);
    } catch {
      setImageCopyState("error");
      window.setTimeout(() => setImageCopyState("idle"), 3000);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-rer-border pb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rer-muted">
            {selectedArticle &&
            (selectedArticle.rubrique || selectedArticle.format)
              ? [
                  selectedArticle.rubrique?.libelle,
                  selectedArticle.format?.libelle,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Prévisualisation"}
          </p>
          {selectedArticle && (
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {selectedArticle.titre}
            </h2>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            disabled={!canCopy}
            onClick={handleCopyHtml}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium shadow-sm ${
              canCopy
                ? "bg-rer-orange text-white hover:bg-[#e25730]"
                : "bg-rer-app text-rer-muted"
            }`}
          >
            {copyState === "html"
              ? "HTML copié"
              : copyState === "error"
              ? "Erreur copie"
              : "Copier HTML"}
          </button>
          <button
            type="button"
            disabled={!canCopy}
            onClick={handleCopyText}
            className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium ${
              canCopy
                ? "border-rer-border bg-white text-rer-text hover:bg-rer-app/60"
                : "border-rer-border bg-rer-app text-rer-muted"
            }`}
          >
            {copyState === "text"
              ? "Texte copié"
              : copyState === "error"
              ? "Erreur copie"
              : "Copier texte"}
          </button>
          <a
            href={`/api/articles/${selectedId}/export?format=word`}
            className="inline-flex items-center rounded-md border border-rer-border bg-white px-2 py-1 text-[11px] font-medium text-rer-text hover:bg-rer-app/60"
          >
            Exporter Word
          </a>
          <Link
            href={`/articles/${selectedId}`}
            className="inline-flex items-center rounded-md border border-rer-border bg-white px-2 py-1 text-[11px] font-medium text-rer-text hover:bg-rer-app/60"
          >
            Ouvrir en pleine page
          </Link>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-52 animate-pulse rounded bg-slate-100" />
          <div className="h-32 w-full animate-pulse rounded bg-slate-100" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && detail && (
        <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm text-rer-text">
          {showEtat && detail.etat && (
            <p className="text-xs text-rer-muted">
              État :{" "}
              <span className="font-medium">{detail.etat.libelle}</span>
            </p>
          )}
          <p className="text-xs text-rer-muted">
            {detail.auteur &&
              `${detail.auteur.prenom} ${detail.auteur.nom}`}
            {detail.mutuelle && ` · ${detail.mutuelle.nom}`}
            {(() => {
              const d =
                detail.datePublication ??
                detail.dateDepot ??
                detail.createdAt ??
                null;
              if (!d) return null;
              return ` · Publié le ${new Date(d).toLocaleDateString(
                "fr-FR"
              )}`;
            })()}
          </p>

          {detail.lienPhoto && (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-md border border-rer-border bg-rer-app">
                <img
                  src={detail.lienPhoto}
                  alt={detail.legendePhoto || detail.titre}
                  className="h-auto w-full max-h-64 object-cover"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <a
                  href={detail.lienPhoto}
                  download
                  className="inline-flex items-center rounded-md border border-rer-border bg-white px-2 py-1 text-[11px] font-medium text-rer-text hover:bg-rer-app/60"
                >
                  Télécharger l’image
                </a>
                <button
                  type="button"
                  onClick={handleCopyImageUrl}
                  className="inline-flex items-center rounded-md border border-rer-border bg-rer-app px-2 py-1 text-[11px] font-medium text-rer-text hover:bg-rer-app/80"
                >
                  {imageCopyState === "copied"
                    ? "URL copiée"
                    : imageCopyState === "error"
                    ? "Erreur copie"
                    : "Copier l’URL"}
                </button>
              </div>
              {detail.legendePhoto && (
                <p className="text-xs text-rer-muted">
                  {detail.legendePhoto}
                </p>
              )}
            </div>
          )}

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

          {detail.postRs && (
            <div className="rounded-md bg-rer-app p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Post réseaux sociaux
              </p>
              <p className="whitespace-pre-wrap text-sm text-rer-text">
                {detail.postRs}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function ArticlesExplorerView({
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
  showEtat,
}: ArticlesExplorerViewProps) {
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasMore, setHasMore] = useState(articles.length < total);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef(initialPage);

  // Quand les filtres / la recherche changent (nouvelles props côté serveur),
  // on réinitialise la liste visible, la pagination et la sélection si nécessaire.
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

  const updateUrlSelection = (id: string | null) => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("article", id);
    } else {
      params.delete("article");
    }
    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    updateUrlSelection(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsDrawerOpen(true);
    }
  };

  const handleOpenFull = (id: string) => {
    router.push(`/articles/${id}`);
  };

  const handleExportWord = (id: string) => {
    window.open(`/api/articles/${id}/export?format=word`, "_blank");
  };

  useArticleShortcuts({
    articles: visibleArticles,
    selectedId,
    onSelect: handleSelect,
    onOpenFull: handleOpenFull,
    onExportWord: handleExportWord,
  });

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

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        <div className="space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto pr-1 border-r border-rer-border">
          {visibleArticles.map((article) => {
            const isSelected = article.id === selectedId;
            return (
              <button
                key={article.id}
                type="button"
                onClick={() => handleSelect(article.id)}
                aria-pressed={isSelected}
                className={`group flex w-full cursor-pointer rounded-2xl text-left transition-colors transition-shadow transition-transform duration-150 ease-out ${
                  isSelected
                    ? "border border-rer-blue bg-rer-blue/5 shadow-md"
                    : "border border-transparent bg-white hover:border-rer-border hover:bg-rer-app hover:shadow-sm hover:-translate-y-[1px]"
                }`}
              >
                <article className="flex h-full flex-1 items-stretch gap-3 overflow-hidden rounded-2xl">
                  <div className="relative hidden w-32 flex-none bg-rer-app sm:block">
                    {article.lienPhoto ? (
                      <img
                        src={article.lienPhoto}
                        alt={article.legendePhoto || article.titre}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-rer-muted">
                        Pas de photo
                      </div>
                    )}
                  </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                    <div className="flex flex-wrap items-center justify-end gap-1 text-[11px]">
                      {article.format && (
                        <span
                          className={getFormatBadgeClasses(
                            article.format.libelle
                          )}
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
                      {showEtat && article.etat && (
                        <span
                          className={getEtatBadgeClasses(
                            article.etat.slug,
                            isSelected
                          )}
                        >
                          {article.etat.libelle}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-rer-text">
                      {article.titre}
                    </p>
                    {article.chapo && (
                      <p className="line-clamp-2 text-xs text-rer-muted">
                        {article.chapo}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-rer-muted">
                      <p className="truncate">
                        {article.auteur &&
                          `${article.auteur.prenom} ${article.auteur.nom}`}
                        {article.mutuelle && ` · ${article.mutuelle.nom}`}
                      </p>
                      <p className="whitespace-nowrap">
                        {(() => {
                          const d =
                            article.datePublication ??
                            article.dateDepot ??
                            article.createdAt;
                          return d
                            ? new Date(d).toLocaleDateString("fr-FR")
                            : null;
                        })()}
                      </p>
                    </div>
                  </div>
                </article>
              </button>
            );
          })}
          <div ref={sentinelRef} className="h-6 lg:h-8" />
        </div>

        <div className="hidden min-h-[260px] flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-rer-border lg:flex">
          {!selectedId && (
            <p className="text-sm text-rer-muted">
              Sélectionnez un article dans la liste pour voir son contenu.
            </p>
          )}

          {selectedId && (
            <ArticleDetailContent
              selectedId={selectedId}
              selectedArticle={selectedArticle}
              loading={loading}
              error={error}
              detail={detail}
              showEtat={showEtat}
            />
          )}
        </div>
      </div>

      {selectedId && isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 top-16 rounded-t-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rer-border px-4 py-3">
              <span className="text-sm font-medium text-rer-text">
                Prévisualisation
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-full border border-rer-border bg-white px-2 py-1 text-xs text-rer-muted hover:bg-rer-app/60"
              >
                Fermer
              </button>
            </div>
            <div className="h-[calc(100vh-4.5rem)] overflow-y-auto px-4 py-3">
              <ArticleDetailContent
                selectedId={selectedId}
                selectedArticle={selectedArticle}
                loading={loading}
                error={error}
                detail={detail}
                showEtat={showEtat}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

