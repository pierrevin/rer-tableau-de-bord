"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ingestDebug } from "@/lib/ingest-debug";
import { getEtatBadgeClasses } from "../articles/ArticlesCardsExplorer";
import RichArticleEditor from "../components/RichArticleEditor";

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
  contenuJson?: unknown | null;
  auteurId: string;
  mutuelleId: string | null;
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

type AuteurOption = {
  id: string;
  prenom: string;
  nom: string;
  mutuelle?: { nom: string | null } | null;
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
  const router = useRouter();
  const [updatingEtat, setUpdatingEtat] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [postRsDraft, setPostRsDraft] = useState("");
  const [auteursOptions, setAuteursOptions] = useState<AuteurOption[]>([]);
  const [auteurIdDraft, setAuteurIdDraft] = useState<string | null>(null);

  useEffect(() => {
    if (detail) {
      setTitleDraft(detail.titre);
      setPostRsDraft(detail.postRs ?? "");
      setAuteurIdDraft(detail.auteurId ?? null);
    } else if (selectedArticle) {
      setTitleDraft(selectedArticle.titre);
    }
  }, [detail, selectedArticle]);

  useEffect(() => {
    let cancelled = false;
    if (auteursOptions.length > 0) return;
    fetch("/api/admin/auteurs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        setAuteursOptions(data.auteurs as AuteurOption[]);
      })
      .catch(() => {
        // silencieux pour l’instant
      });
    return () => {
      cancelled = true;
    };
  }, [auteursOptions.length]);

  const handleChangeEtat = async (targetEtatId: string) => {
    if (!detail || updatingEtat) return;
    setUpdatingEtat(true);
    try {
      ingestDebug({
        sessionId: "fb943b",
        runId: "pre-fix",
        hypothesisId: "H_STATE_CHANGE",
        location: "app/admin/AdminReviewExplorer.tsx:handleChangeEtat:beforeFetch",
        message: "handleChangeEtat called",
        data: { articleId: detail.id, targetEtatId },
      });

      const res = await fetch(`/api/articles/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etatId: targetEtatId }),
      });
      ingestDebug({
        sessionId: "fb943b",
        runId: "pre-fix",
        hypothesisId: "H_STATE_CHANGE",
        location: "app/admin/AdminReviewExplorer.tsx:handleChangeEtat:afterFetch",
        message: "handleChangeEtat response",
        data: { ok: res.ok, status: res.status },
      });

      if (!res.ok) {
        return;
      }
      const updated = (await res.json()) as ArticleDetail;
      onEtatUpdated(updated.etat?.slug ?? null);
      router.refresh();
    } finally {
      setUpdatingEtat(false);
    }
  };

  const sortedEtats = [...etats].sort((a, b) => a.ordre - b.ordre);
  const currentSlug = detail?.etat?.slug ?? selectedArticle?.etat?.slug ?? null;

  const buildInitialHtml = useMemo(() => {
    if (!detail) return "";
    const chapoHtml = detail.chapo
      ? `<p class="chapo">${detail.chapo}</p>`
      : "";
    return `${chapoHtml}${detail.contenu ?? ""}`;
  }, [detail]);

  const extractChapoAndBody = (html: string): { chapo: string | null; body: string } => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      let chapoText: string | null = null;
      const chapoEl =
        doc.querySelector("p.chapo") ?? doc.querySelector("p");
      if (chapoEl) {
        chapoText = (chapoEl.textContent ?? "").trim() || null;
        chapoEl.remove();
      }
      const bodyHtml = doc.body.innerHTML.trim();
      return { chapo: chapoText, body: bodyHtml };
    } catch {
      return { chapo: detail?.chapo ?? null, body: html };
    }
  };

  const handleSaveTitle = async () => {
    if (!detail && !selectedArticle) return;
    const nextTitle = titleDraft.trim();
    const currentTitle = detail?.titre ?? selectedArticle?.titre ?? "";
    if (!nextTitle || nextTitle === currentTitle) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/articles/${detail?.id ?? selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre: nextTitle }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSavePostRs = async () => {
    if (!detail) return;
    const next = postRsDraft.trim();
    if ((detail.postRs ?? "") === next) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/articles/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postRs: next || null }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSavingMeta(false);
    }
  };

  const handleChangeAuteur = async (newAuteurId: string) => {
    setAuteurIdDraft(newAuteurId);
    if (!detail) return;
    if (!newAuteurId || newAuteurId === detail.auteurId) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/articles/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auteurId: newAuteurId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSavingMeta(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-rer-border pb-3">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rer-muted">
            Mode relecture
          </p>
          <textarea
            className="w-full resize-none border-none bg-transparent p-0 text-lg font-semibold leading-snug text-rer-text focus:outline-none focus:ring-0"
            rows={2}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleSaveTitle}
          />
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-rer-muted">
            <select
              className="min-w-[160px] rounded-full border border-rer-border bg-white px-2 py-0.5 text-xs text-rer-text"
              value={auteurIdDraft ?? ""}
              onChange={(e) => handleChangeAuteur(e.target.value)}
            >
              <option value="">Sélectionner…</option>
              {auteursOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.prenom} {a.nom}
                  {a.mutuelle?.nom ? ` · ${a.mutuelle.nom}` : ""}
                </option>
              ))}
            </select>
            {savingMeta && (
              <span className="text-[11px] text-rer-subtle">
                Enregistrement…
              </span>
            )}
          </div>
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
          {detail && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-rer-muted">
                <span>Contenu de l’article</span>
                {savingContent && <span>Enregistrement…</span>}
              </div>
              <RichArticleEditor
                initialJson={detail.contenuJson ?? undefined}
                initialHtml={buildInitialHtml}
                onChange={async ({ json, html }) => {
                  if (!detail || savingContent) return;
                  setSavingContent(true);
                  try {
                    const { chapo, body } = extractChapoAndBody(html);
                    ingestDebug({
                      sessionId: "fb943b",
                      runId: "pre-fix",
                      hypothesisId: "H_AUTOSAVE_OR_ONCHANGE",
                      location:
                        "app/admin/AdminReviewExplorer.tsx:RichArticleEditor:onChange:beforeFetch",
                      message: "Admin auto-save triggered",
                      data: {
                        articleId: detail.id,
                        htmlLength: html.length,
                        chapoPreview: chapo ? chapo.slice(0, 80) : null,
                        bodyLength: body.length,
                      },
                    });

                    const res = await fetch(`/api/articles/${detail.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        chapo,
                        contenuHtml: body,
                        contenuJson: json,
                      }),
                    });
                    if (!res.ok) {
                      console.error("Erreur lors de la sauvegarde du contenu");
                    }
                    ingestDebug({
                      sessionId: "fb943b",
                      runId: "pre-fix",
                      hypothesisId: "H_AUTOSAVE_OR_ONCHANGE",
                      location:
                        "app/admin/AdminReviewExplorer.tsx:RichArticleEditor:onChange:afterFetch",
                      message: "Admin auto-save response",
                      data: { articleId: detail.id, ok: res.ok, status: res.status },
                    });
                  } catch (e) {
                    console.error(
                      "Erreur lors de la sauvegarde du contenu",
                      e
                    );
                  } finally {
                    setSavingContent(false);
                  }
                }}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-rer-muted">
              Post réseaux sociaux (optionnel)
            </label>
            <textarea
              className="w-full rounded-md border border-rer-border px-2 py-1 text-sm text-rer-text shadow-sm focus:border-rer-blue focus:outline-none focus:ring-1 focus:ring-rer-blue"
              rows={3}
              value={postRsDraft}
              onChange={(e) => setPostRsDraft(e.target.value)}
              onBlur={handleSavePostRs}
              placeholder="Texte court prêt à être copié-collé pour les réseaux sociaux…"
            />
          </div>

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
    if (slug === null) {
      updateUrl({ etat: "", article: null });
    } else {
      updateUrl({ etat: slug, article: null });
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    updateUrl({ article: id });
  };

  const handleEtatUpdated = (etatSlugUpdated: string | null) => {
    const targetEtat = etats.find((e) => e.slug === etatSlugUpdated) ?? null;

    setVisibleArticles((prev) =>
      prev.map((a) =>
        a.id === selectedId
          ? {
              ...a,
              etat: etatSlugUpdated
                ? {
                    libelle:
                      targetEtat?.libelle ??
                      a.etat?.libelle ??
                      etatSlugUpdated,
                    slug: etatSlugUpdated,
                  }
                : null,
            }
          : a
      )
    );

    setDetail((prev) => {
      if (!prev) return prev;
      if (!etatSlugUpdated) {
        return { ...prev, etat: null };
      }
      return {
        ...prev,
        etat: {
          libelle:
            targetEtat?.libelle ??
            prev.etat?.libelle ??
            etatSlugUpdated,
          slug: etatSlugUpdated,
        },
      };
    });
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

  const sortedEtats = [...etats].sort((a, b) => a.ordre - b.ordre);

  return (
    <>
      {/* Filtres d’état dédiés relecture */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-rer-muted">
          États
        </span>
        <button
          type="button"
          onClick={() => handleEtatFilterClick(null)}
          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
            !etatSlug
              ? "bg-rer-blue text-white"
              : "bg-white text-rer-text ring-1 ring-rer-border hover:bg-rer-app"
          }`}
        >
          Tous
        </button>
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
        <div className="max-h-[calc(100vh-140px)] space-y-2 overflow-y-auto px-2 py-2">
          {visibleArticles.length === 0 ? (
            <p className="rounded-md bg-white px-3 py-6 text-center text-sm text-rer-muted shadow-sm ring-1 ring-rer-border">
              Aucun article ne correspond à ces critères. Essayez d&apos;élargir
              votre recherche ou de modifier les filtres.
            </p>
          ) : (
            <>
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
                            className={`${getEtatBadgeClasses(
                              article.etat.slug,
                              false
                            )} whitespace-nowrap`}
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
            </>
          )}
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

