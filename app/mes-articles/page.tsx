import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MesArticlesFiltersBar } from "./MesArticlesFiltersBar";
import { MesArticlesTable } from "./MesArticlesTable";

export const dynamic = "force-dynamic";

type SearchParams = {
  page?: string;
  etat?: string;
  mutuelleId?: string;
  sort?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

function buildLastActionLabel(options: {
  etatSlug: string | null;
  etatLibelle: string | null;
  lastHistoriqueAt: Date | null;
  lastHistoriqueUserEmail: string | null;
  dateDepot: Date | null;
  createdAt: Date;
}): { label: string; at: Date | null } {
  const { etatSlug, etatLibelle, lastHistoriqueAt, lastHistoriqueUserEmail, dateDepot, createdAt } =
    options;

  const baseDate = lastHistoriqueAt ?? dateDepot ?? createdAt ?? null;

  if (!etatSlug) {
    return {
      label: "Créé",
      at: baseDate,
    };
  }

  if (etatSlug === "a_relire") {
    return {
      label: "Déposé",
      at: baseDate,
    };
  }

  if (etatSlug === "corrige") {
    return {
      label: lastHistoriqueUserEmail
        ? `Corrigé par ${lastHistoriqueUserEmail}`
        : "Corrigé",
      at: baseDate,
    };
  }

  if (etatSlug === "valide") {
    return {
      label: lastHistoriqueUserEmail
        ? `Validé par ${lastHistoriqueUserEmail}`
        : "Validé",
      at: baseDate,
    };
  }

  if (etatSlug === "publie") {
    return {
      label: "Publié",
      at: baseDate,
    };
  }

  return {
    label: etatLibelle ?? "Mise à jour",
    at: baseDate,
  };
}

export default async function MesArticlesPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const auteurId = sessionUser.auteurId;

  const rawPage = params.page;
  const page = Math.max(Number(rawPage) || 1, 1);
  const etatSlug = params.etat ?? "";
  const mutuelleIdParam = params.mutuelleId ?? "";
  const sort = params.sort ?? "lastModifiedDesc";

  const take = 20;
  const skip = (page - 1) * take;

  const where: any = {};

  if (auteurId) {
    where.auteurId = auteurId;
  } else {
    // Aucun auteur associé : on force un filtre impossible pour retourner 0 résultat.
    where.auteurId = "__none__";
  }

  if (etatSlug) {
    where.etat = { slug: etatSlug };
  }

  if (mutuelleIdParam) {
    where.mutuelleId = mutuelleIdParam;
  }

  const orderBy =
    sort === "dateDepotAsc"
      ? { dateDepot: "asc" }
      : sort === "dateDepotDesc"
      ? { dateDepot: "desc" }
      : sort === "etat"
      ? { etat: { ordre: "asc" } }
      : sort === "lastModifiedAsc"
      ? { updatedAt: "asc" }
      : { updatedAt: "desc" };

  const [articles, total, etats, groupedByEtat] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: orderBy as any,
      skip,
      take,
      include: {
        etat: true,
        mutuelle: true,
        rubrique: true,
        format: true,
        historiques: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { etat: true, user: true },
        },
      },
    }),
    prisma.article.count({ where }),
    prisma.etat.findMany({ orderBy: { ordre: "asc" } }),
    prisma.article.groupBy({
      by: ["etatId"],
      _count: { _all: true },
      where,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / take), 1);

  const etatById = new Map(
    etats.map((etat) => [
      etat.id,
      {
        id: etat.id,
        slug: etat.slug,
        libelle: etat.libelle,
      },
    ])
  );

  const statusCountsBySlug: Record<string, number> = {};
  for (const group of groupedByEtat) {
    const etat = group.etatId ? etatById.get(group.etatId) : null;
    if (!etat?.slug) continue;
    statusCountsBySlug[etat.slug] = (statusCountsBySlug[etat.slug] ?? 0) + group._count._all;
  }

  const statusParts: string[] = [];
  const pushStatus = (slug: string, label: string) => {
    const value = statusCountsBySlug[slug] ?? 0;
    if (value > 0) {
      statusParts.push(`${value} ${label}`);
    }
  };

  pushStatus("a_relire", "en relecture");
  pushStatus("corrige", "corrigés");
  pushStatus("valide", "validés");
  pushStatus("publie", "publiés");

  const statusSummary =
    statusParts.length > 0
      ? statusParts.join(" · ")
      : "Aucun article pour le moment";

  const rows = articles.map((article) => {
    const lastHistorique = article.historiques[0] ?? null;
    const etatSlugForRow = article.etat?.slug ?? null;
    const { label: lastActionLabel, at: lastActionAt } = buildLastActionLabel({
      etatSlug: etatSlugForRow,
      etatLibelle: article.etat?.libelle ?? null,
      lastHistoriqueAt: lastHistorique ? lastHistorique.createdAt : null,
      lastHistoriqueUserEmail: lastHistorique?.user?.email ?? null,
      dateDepot: article.dateDepot ?? null,
      createdAt: article.createdAt,
    });

    const canEdit =
      etatSlugForRow !== "valide" && etatSlugForRow !== "publie";

    return {
      id: article.id,
      titre: article.titre,
      chapo: article.chapo ?? null,
      lienPhoto: article.lienPhoto ?? null,
      rubrique: article.rubrique?.libelle ?? null,
      format: article.format?.libelle ?? null,
      mutuelle: article.mutuelle?.nom ?? null,
      etatLibelle: article.etat?.libelle ?? null,
      etatSlug: etatSlugForRow,
      lastAction: lastActionLabel,
      lastActionAt: lastActionAt ? lastActionAt.toISOString() : null,
      updatedAt: article.updatedAt.toISOString(),
      canEdit,
    };
  });

  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-rer-text">Mes articles</h1>
            <p className="text-sm text-rer-muted">{statusSummary}</p>
          </div>
          <Link
            href="/articles/depot"
            className="btn-cta"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-base leading-none">
              +
            </span>
            <span>Nouvel article</span>
          </Link>
        </header>

        <MesArticlesFiltersBar
          total={total}
          etats={etats.map((etat) => ({
            id: etat.id,
            slug: etat.slug,
            libelle: etat.libelle,
          }))}
          currentEtatSlug={etatSlug}
          currentSort={sort}
        />

        <section aria-label="Mes articles" className="mt-2">
          <MesArticlesTable
            articles={rows}
            total={total}
            pageSize={take}
            currentPage={page}
            totalPages={totalPages}
          />
        </section>
      </div>
    </main>
  );
}

