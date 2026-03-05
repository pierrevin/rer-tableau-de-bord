import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEditArticles } from "@/lib/auth";
import { ingestDebug } from "@/lib/ingest-debug";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      auteur: true,
      mutuelle: true,
      rubrique: true,
      format: true,
      etat: true,
      historiques: {
        orderBy: { createdAt: "desc" },
        include: { etat: true, user: true },
      },
    },
  });
  if (!article) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user = null;
  try {
    user = await getSessionUser(request);
  } catch {
    user = null;
  }

  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

  const body = await request.json();

  ingestDebug({
    sessionId: "fb943b",
    runId: "pre-fix",
    hypothesisId: "H_API_PATCH",
    location: "app/api/articles/[id]/route.ts:PATCH:beforeUpdate",
    message: "PATCH /api/articles/[id] called",
    data: { articleId: id, keys: Object.keys(body ?? {}) },
  });
  const {
    titre,
    chapo,
    contenu,
    contenuHtml,
    contenuJson,
    etatId,
    auteurId,
    mutuelleId,
    rubriqueId,
    formatId,
    legendePhoto,
    postRs,
    lienPhoto,
    lienGoogleDoc,
  } = body;

  const data: Record<string, unknown> = {};
  if (typeof titre === "string") data.titre = titre.trim();
  if (chapo !== undefined) data.chapo = chapo?.trim() || null;
  if (
    typeof contenuHtml === "string" ||
    typeof contenu === "string" ||
    contenuJson !== undefined
  ) {
    const finalContenuHtml: string =
      (typeof contenuHtml === "string" && contenuHtml.trim()) ||
      (typeof contenu === "string" && contenu.trim()) ||
      existing.contenu;
    data.contenu = finalContenuHtml.trim();
    if (contenuJson !== undefined) {
      data.contenuJson = contenuJson;
    }
  }
  if (etatId !== undefined) data.etatId = etatId || null;
  if (auteurId !== undefined && typeof auteurId === "string" && auteurId.trim()) {
    data.auteurId = auteurId.trim();
  }
  if (mutuelleId !== undefined) data.mutuelleId = mutuelleId || null;
  if (rubriqueId !== undefined) data.rubriqueId = rubriqueId || null;
  if (formatId !== undefined) data.formatId = formatId || null;
  if (legendePhoto !== undefined) data.legendePhoto = legendePhoto?.trim() || null;
  if (postRs !== undefined) data.postRs = postRs?.trim() || null;
  if (lienPhoto !== undefined) data.lienPhoto = lienPhoto?.trim() || null;
  if (lienGoogleDoc !== undefined) data.lienGoogleDoc = lienGoogleDoc?.trim() || null;

  const previousEtatId = existing.etatId;
  const newEtatId = (data.etatId as string | null) ?? previousEtatId;
  const etatChanged = newEtatId !== previousEtatId;

  // Si l'état change vers \"valide\" et que datePublication est encore vide,
  // on fige la date de validation à maintenant.
  if (etatChanged && newEtatId) {
    const etatCible = await prisma.etat.findUnique({
      where: { id: newEtatId },
      select: { slug: true },
    });
    if (
      etatCible?.slug === "valide" &&
      !existing.datePublication &&
      data.datePublication === undefined
    ) {
      data.datePublication = new Date();
    }
  }

  const article = await prisma.article.update({
    where: { id },
    data,
    include: {
      auteur: true,
      mutuelle: true,
      rubrique: true,
      format: true,
      etat: true,
      historiques: {
        orderBy: { createdAt: "desc" },
        include: { etat: true, user: true },
      },
    },
  });

  if (etatChanged && newEtatId) {
    await prisma.articleHistorique.create({
      data: {
        articleId: id,
        etatId: newEtatId,
        userId: user?.id ?? null,
      },
    });
  }

  ingestDebug({
    sessionId: "fb943b",
    runId: "pre-fix",
    hypothesisId: "H_API_PATCH",
    location: "app/api/articles/[id]/route.ts:PATCH:afterUpdate",
    message: "PATCH /api/articles/[id] completed",
    data: { articleId: id, etatChanged, newEtatId },
  });

  return NextResponse.json(article);
}
