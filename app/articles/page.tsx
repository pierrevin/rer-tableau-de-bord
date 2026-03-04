import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArticlesExplorerView } from "./ArticlesCardsExplorer";
import { ArticlesCardsView } from "./ArticlesCardsView";
import { ArticlesTableView } from "./ArticlesTableView";
import { ArticlesFiltersBar } from "./ArticlesFiltersBar";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  page?: string;
  etat?: string;
  mutuelleId?: string;
  rubriqueId?: string;
  formatId?: string;
   since?: string;
   from?: string;
   to?: string;
  article?: string;
  view?: string;
};

type PageProps = {
  searchParams?: SearchParams;
};

export default async function ArticlesPage({ searchParams }: PageProps) {
  const lastArticle = await prisma.article.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const q = searchParams?.q?.trim() || "";
  const page = Math.max(Number(searchParams?.page) || 1, 1);
  const etatSlug = searchParams?.etat || "";
  const mutuelleParam = searchParams?.mutuelleId || "";
  const rubriqueParam = searchParams?.rubriqueId || "";
  const formatParam = searchParams?.formatId || "";
  const sinceParam = searchParams?.since || "";
  const fromParam = searchParams?.from || "";
  const toParam = searchParams?.to || "";
  const selectedArticleId = searchParams?.article || "";
  const rawView = searchParams?.view;
  const view: "cards" | "explorer" | "table" =
    rawView === "table" || rawView === "cards" || rawView === "explorer"
      ? rawView
      : "explorer";

  const take = 20;
  const skip = (page - 1) * take;

  const where: any = {};

  if (q) {
    where.OR = [
      { titre: { contains: q, mode: "insensitive" } },
      { chapo: { contains: q, mode: "insensitive" } },
      { contenu: { contains: q, mode: "insensitive" } },
    ];
  }

  if (etatSlug) {
    where.etat = { slug: etatSlug };
  }

  const createdAtFilter: any = {};
  if (fromParam) {
    createdAtFilter.gte = new Date(fromParam);
  } else if (sinceParam) {
    createdAtFilter.gte = new Date(sinceParam);
  }
  if (toParam) {
    createdAtFilter.lte = new Date(toParam);
  }
  if (Object.keys(createdAtFilter).length > 0) {
    where.createdAt = createdAtFilter;
  }

  const mutuelleIds = mutuelleParam
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (mutuelleIds.length === 1) {
    where.mutuelleId = mutuelleIds[0];
  } else if (mutuelleIds.length > 1) {
    where.mutuelleId = { in: mutuelleIds };
  }

  const rubriqueIds = rubriqueParam
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (rubriqueIds.length === 1) {
    where.rubriqueId = rubriqueIds[0];
  } else if (rubriqueIds.length > 1) {
    where.rubriqueId = { in: rubriqueIds };
  }

  const formatIds = formatParam
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (formatIds.length === 1) {
    where.formatId = formatIds[0];
  } else if (formatIds.length > 1) {
    where.formatId = { in: formatIds };
  }

  const [articles, total, etats, mutuelles] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        auteur: true,
        mutuelle: true,
        rubrique: true,
        format: true,
        etat: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.article.count({ where }),
    prisma.etat.findMany({ orderBy: { ordre: "asc" } }),
    prisma.mutuelle.findMany({ orderBy: { nom: "asc" } }),
  ]);

  const totalPages = Math.max(Math.ceil(total / take), 1);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Liste des articles
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Rechercher, filtrer par état ou par mutuelle, puis ouvrir un
                article pour le lire, le corriger ou l&apos;exporter.
              </p>
            </div>
            <Link
              href="/articles/depot"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              Déposer un article
            </Link>
          </div>
        </header>

        <ArticlesFiltersBar
          total={total}
          lastCreatedAt={lastArticle?.createdAt?.toISOString() ?? null}
        />

        <div className="mb-3 flex flex-wrap items-center justify-end gap-2 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1">
            <Link
              href={{
                pathname: "/articles",
                query: { ...searchParams, view: "cards", page: String(page) },
              }}
              className={`rounded-full px-3 py-1 ${
                view === "cards"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:bg-white/60"
              }`}
            >
              Cartes
            </Link>
            <Link
              href={{
                pathname: "/articles",
                query: { ...searchParams, view: "explorer", page: String(page) },
              }}
              className={`rounded-full px-3 py-1 ${
                view === "explorer"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:bg-white/60"
              }`}
            >
              Explorer
            </Link>
            <Link
              href={{
                pathname: "/articles",
                query: { ...searchParams, view: "table", page: String(page) },
              }}
              className={`rounded-full px-3 py-1 ${
                view === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:bg-white/60"
              }`}
            >
              Tableau
            </Link>
          </div>
        </div>

        <section aria-label="Liste des articles" className="mt-4 space-y-3">
          {view === "table" ? (
            <ArticlesTableView
              initialArticles={articles}
              total={total}
              initialPage={page}
              pageSize={take}
              q={q}
              etatSlug={etatSlug}
              mutuelleId={mutuelleParam}
              rubriqueId={rubriqueParam}
              formatId={formatParam}
              since={sinceParam}
              from={fromParam}
              to={toParam}
            />
          ) : view === "explorer" ? (
            <ArticlesExplorerView
              articles={articles}
              total={total}
              initialPage={page}
              pageSize={take}
              q={q}
              etatSlug={etatSlug}
              mutuelleId={mutuelleParam}
              rubriqueId={rubriqueParam}
              formatId={formatParam}
              since={sinceParam}
              from={fromParam}
              to={toParam}
              initialSelectedId={selectedArticleId || undefined}
            />
          ) : (
            <ArticlesCardsView
              initialArticles={articles}
              total={total}
              initialPage={page}
              pageSize={take}
              q={q}
              etatSlug={etatSlug}
              mutuelleId={mutuelleParam}
              rubriqueId={rubriqueParam}
              formatId={formatParam}
              since={sinceParam}
              from={fromParam}
              to={toParam}
            />
          )}
        </section>

        {/* Bouton flottant mobile pour déposer un article */}
        <Link
          href="/articles/depot"
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 lg:hidden"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-base leading-none">
            +
          </span>
          <span>Nouvel article</span>
        </Link>
      </div>
    </main>
  );
}

