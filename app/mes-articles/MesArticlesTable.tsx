"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getEtatBadgeClasses } from "../articles/ArticlesCardsExplorer";
import { ArticleHistoryDrawer } from "./ArticleHistoryDrawer";

type MesArticleRow = {
  id: string;
  titre: string;
  rubrique: string | null;
  format: string | null;
  mutuelle: string | null;
  etatLibelle: string | null;
  etatSlug: string | null;
  lastAction: string;
  lastActionAt: string | null;
  updatedAt: string;
  canEdit: boolean;
};

type MesArticlesTableProps = {
  articles: MesArticleRow[];
  total: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
};

export function MesArticlesTable({
  articles,
  total,
  pageSize,
  currentPage,
  totalPages,
}: MesArticlesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyArticleId, setHistoryArticleId] = useState<string | null>(null);

  const openHistory = (articleId: string) => {
    setHistoryArticleId(articleId);
    setHistoryOpen(true);
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryArticleId(null);
  };

  const goToPage = (page: number) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(safePage));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const confirmed = window.confirm(
      `Supprimer définitivement ${selectedIds.length} article(s) sélectionné(s) ?`
    );
    if (!confirmed) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/articles/${id}`, { method: "DELETE" })
        )
      );
      exitBulkMode();
      router.refresh();
    } catch {
      alert("Erreur réseau lors de la suppression en masse.");
    }
  };

  if (!articles.length) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-rer-border bg-white shadow-sm ring-1 ring-rer-border">
          <tbody>
            <tr>
              <td className="px-3 py-6 text-center text-sm text-rer-muted">
                Vous n&apos;avez pas encore d&apos;article. Déposez un premier
                texte pour le retrouver ici.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between text-xs text-rer-muted">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (bulkMode) {
                exitBulkMode();
              } else {
                setBulkMode(true);
              }
            }}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${
              bulkMode
                ? "border-rer-blue bg-rer-blue text-white"
                : "border-rer-border bg-white text-rer-text hover:bg-rer-app"
            }`}
          >
            Sélection multiple
          </button>
          {bulkMode && (
            <span className="text-[11px] text-rer-muted">
              {selectedIds.length
                ? `${selectedIds.length} article(s) sélectionné(s)`
                : "Cliquez sur « Sélectionner » dans la colonne Actions"}
            </span>
          )}
        </div>
        {bulkMode && selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleBulkDelete}
            className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100"
          >
            Supprimer la sélection ({selectedIds.length})
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-rer-border bg-white shadow-sm ring-1 ring-rer-border">
          <thead className="bg-rer-blue text-white">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white/90">
                Titre
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white/90">
                Rubrique / Format
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white/90">
                Mutuelle
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white/90">
                État
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white/90">
                Dernière action
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white/90">
                Dernière modification
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-white/90">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rer-border">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-rer-app">
                <td className="px-3 py-2 align-top text-sm text-rer-text">
                  <Link
                    href={`/articles/${article.id}`}
                    className="font-semibold text-rer-blue hover:underline"
                  >
                    {article.titre}
                  </Link>
                </td>
                <td className="px-3 py-2 align-top text-xs text-rer-muted">
                  <div className="space-y-0.5">
                    <div>{article.rubrique ?? "Rubrique non renseignée"}</div>
                    <div className="text-[11px]">
                      {article.format ?? "Format non renseigné"}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 align-top text-sm text-rer-muted">
                  {article.mutuelle ?? "—"}
                </td>
                <td className="px-3 py-2 align-top text-sm">
                  {article.etatLibelle ? (
                    <span
                      className={getEtatBadgeClasses(
                        article.etatSlug ?? undefined
                      )}
                    >
                      {article.etatLibelle}
                    </span>
                  ) : (
                    <span className="text-xs text-rer-muted">État inconnu</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top text-xs text-rer-muted">
                  <div>{article.lastAction}</div>
                  {article.lastActionAt && (
                    <div className="text-[11px]">
                      {new Date(article.lastActionAt).toLocaleString("fr-FR")}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 align-top text-xs text-rer-muted">
                  {new Date(article.updatedAt).toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2 align-top text-right text-xs">
                  <div className="inline-flex flex-col items-end gap-1">
                    <Link
                      href={`/articles/${article.id}`}
                      className="text-xs font-medium text-rer-blue hover:text-rer-text"
                    >
                      Voir
                    </Link>
                    <button
                      type="button"
                      onClick={() => openHistory(article.id)}
                      className="text-xs font-medium text-rer-blue hover:text-rer-text"
                    >
                      Voir les modifications
                    </button>
                    {article.canEdit && (
                      <Link
                        href={`/articles/${article.id}/edit`}
                        className="text-xs font-medium text-rer-blue hover:text-rer-text"
                      >
                        Continuer l&apos;édition
                      </Link>
                    )}
                    {bulkMode && (
                      <button
                        type="button"
                        onClick={() => toggleSelected(article.id)}
                        className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                          selectedIds.includes(article.id)
                            ? "border-rer-blue bg-rer-blue text-white"
                            : "border-rer-border bg-white text-rer-muted hover:bg-rer-app"
                        }`}
                      >
                        {selectedIds.includes(article.id)
                          ? "Sélectionné"
                          : "Sélectionner"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-rer-muted">
        <div>
          Page {currentPage} sur {totalPages} ·{" "}
          {total} article{total > 1 ? "s" : ""} (
          {pageSize} par page)
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-full border border-rer-border bg-white px-3 py-1 text-xs font-medium text-rer-muted disabled:opacity-50 hover:bg-rer-app disabled:hover:bg-white"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-full border border-rer-border bg-white px-3 py-1 text-xs font-medium text-rer-muted disabled:opacity-50 hover:bg-rer-app disabled:hover:bg-white"
          >
            Suivant
          </button>
        </div>
      </div>

      <ArticleHistoryDrawer
        articleId={historyArticleId}
        open={historyOpen}
        onClose={closeHistory}
      />
    </>
  );
}

