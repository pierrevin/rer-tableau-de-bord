import { prisma } from "@/lib/prisma";
import { AdminReviewExplorer } from "../AdminReviewExplorer";

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
};

type PageProps = {
  searchParams?: SearchParams;
};

export default async function AdminArticlesQueuePage({
  searchParams,
}: PageProps) {
  const q = searchParams?.q?.trim() || "";
  const page = Math.max(Number(searchParams?.page) || 1, 1);
  const etatSlug = searchParams?.etat ?? "a_relire";
  const mutuelleParam = searchParams?.mutuelleId || "";
  const rubriqueParam = searchParams?.rubriqueId || "";
  const formatParam = searchParams?.formatId || "";
  const sinceParam = searchParams?.since || "";
  const fromParam = searchParams?.from || "";
  const toParam = searchParams?.to || "";
  const selectedArticleId = searchParams?.article || "";

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

  const [articles, total, etats] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        auteur: true,
        mutuelle: true,
        rubrique: true,
        format: true,
        etat: true,
      },
      orderBy: [
        { dateDepot: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take,
    }),
    prisma.article.count({ where }),
    prisma.etat.findMany({ orderBy: { ordre: "asc" } }),
  ]);

  const articleSummaries = articles.map((article) => ({
    ...article,
    dateDepot: article.dateDepot ? article.dateDepot.toISOString() : null,
    datePublication: article.datePublication
      ? article.datePublication.toISOString()
      : null,
    createdAt: article.createdAt.toISOString(),
  }));

  return (
    <section aria-label="File d’articles à relire" className="space-y-3">
      <AdminReviewExplorer
        articles={articleSummaries}
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
        etats={etats}
      />
    </section>
  );
}

