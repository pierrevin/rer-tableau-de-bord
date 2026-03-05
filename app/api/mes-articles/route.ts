import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser(request);

  if (!sessionUser) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié" },
      { status: 401 }
    );
  }

  const auteurId = sessionUser.auteurId;

  const { searchParams } = new URL(request.url);
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") ?? "1", 10)
  );
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10))
  );
  const etatSlug = searchParams.get("etat") ?? "";
  const mutuelleIdParam = searchParams.get("mutuelleId") ?? "";
  const sort = searchParams.get("sort") ?? "lastModifiedDesc";

  const skip = (page - 1) * limit;

  const where: any = {};

  if (auteurId) {
    where.auteurId = auteurId;
  } else {
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
      take: limit,
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
    statusCountsBySlug[etat.slug] =
      (statusCountsBySlug[etat.slug] ?? 0) + group._count._all;
  }

  const buildLastActionLabel = (options: {
    etatSlug: string | null;
    etatLibelle: string | null;
    lastHistoriqueAt: Date | null;
    lastHistoriqueUserEmail: string | null;
    dateDepot: Date | null;
    createdAt: Date;
  }): { label: string; at: Date | null } => {
    const {
      etatSlug,
      etatLibelle,
      lastHistoriqueAt,
      lastHistoriqueUserEmail,
      dateDepot,
      createdAt,
    } = options;

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
  };

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

  return NextResponse.json({
    articles: rows,
    total,
    page,
    limit,
    statusCountsBySlug,
  });
}

