import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEditArticles } from "@/lib/auth";

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
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canEditArticles(user.role)) {
    return NextResponse.json({ error: "Droits insuffisants (relecteur ou admin)" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

  const body = await request.json();
  const {
    titre,
    chapo,
    contenu,
    etatId,
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
  if (typeof contenu === "string") data.contenu = contenu.trim();
  if (etatId !== undefined) data.etatId = etatId || null;
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

  const article = await prisma.article.update({
    where: { id },
    data,
    include: {
      auteur: true,
      mutuelle: true,
      rubrique: true,
      format: true,
      etat: true,
    },
  });

  if (etatChanged && newEtatId) {
    await prisma.articleHistorique.create({
      data: {
        articleId: id,
        etatId: newEtatId,
        userId: user.id,
      },
    });
  }

  return NextResponse.json(article);
}
