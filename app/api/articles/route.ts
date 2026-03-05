import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const q = (searchParams.get("q") ?? "").trim();
  const etatSlug = searchParams.get("etat") ?? "";
  const mutuelleParam = searchParams.get("mutuelleId") ?? "";
  const rubriqueParam = searchParams.get("rubriqueId") ?? "";
  const formatParam = searchParams.get("formatId") ?? "";
  const sinceParam = searchParams.get("since") ?? "";
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const mineParam = searchParams.get("mine") ?? "";

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

  // Filtre "Mes articles" : articles dont l'utilisateur connecté est l'auteur.
  if (mineParam === "1") {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.auteurId) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié ou auteur non associé" },
        { status: 401 }
      );
    }
    where.auteurId = sessionUser.auteurId;
  }

  const dateFilter: any = {};
  if (fromParam) {
    dateFilter.gte = new Date(fromParam);
  } else if (sinceParam) {
    dateFilter.gte = new Date(sinceParam);
  }
  if (toParam) {
    dateFilter.lte = new Date(toParam);
  }
  if (Object.keys(dateFilter).length > 0) {
    // On filtre en priorité sur la date de validation (datePublication).
    // Pour les anciens contenus non validés, on retombe sur createdAt.
    where.OR = [
      ...(where.OR ?? []),
      {
        AND: [
          { datePublication: { not: null } },
          { datePublication: dateFilter },
        ],
      },
      {
        AND: [
          { datePublication: null },
          { createdAt: dateFilter },
        ],
      },
    ];
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

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titre: true,
        chapo: true,
        lienPhoto: true,
        legendePhoto: true,
        dateDepot: true,
        datePublication: true,
        createdAt: true,
        updatedAt: true,
        auteurId: true,
        mutuelleId: true,
        rubriqueId: true,
        formatId: true,
        etatId: true,
        auteur: { select: { id: true, prenom: true, nom: true } },
        mutuelle: { select: { id: true, nom: true } },
        rubrique: { select: { id: true, libelle: true } },
        format: { select: { id: true, libelle: true } },
        etat: { select: { id: true, libelle: true, slug: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);
  return NextResponse.json({ articles, total, page, limit });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titre,
      chapo,
      contenu,
      contenuHtml,
      contenuJson,
      auteurId,
      mutuelleId,
      rubriqueId,
      formatId,
      legendePhoto,
      postRs,
      lienPhoto,
      lienGoogleDoc,
    } = body;

    const finalContenuHtml: string | null =
      typeof contenuHtml === "string" && contenuHtml.trim()
        ? contenuHtml
        : typeof contenu === "string" && contenu.trim()
        ? contenu
        : null;

    if (!titre || typeof titre !== "string" || !finalContenuHtml || !auteurId) {
      return NextResponse.json(
        { error: "Champs requis : titre, contenu, auteurId" },
        { status: 400 }
      );
    }

    const etatArelire = await prisma.etat.findFirst({
      where: { slug: "a_relire" },
    });

    const article = await prisma.article.create({
      data: {
        titre: titre.trim(),
        chapo: chapo?.trim() || null,
        contenu: finalContenuHtml.trim(),
        contenuJson: contenuJson ?? null,
        auteurId,
        mutuelleId: mutuelleId || null,
        rubriqueId: rubriqueId || null,
        formatId: formatId || null,
        etatId: etatArelire?.id ?? null,
        legendePhoto: legendePhoto?.trim() || null,
        postRs: postRs?.trim() || null,
        lienPhoto: lienPhoto?.trim() || null,
        lienGoogleDoc: lienGoogleDoc?.trim() || null,
        dateDepot: new Date(),
      },
      include: {
        auteur: true,
        etat: true,
      },
    });

    return NextResponse.json(article);
  } catch (e) {
    console.error("POST /api/articles", e);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
