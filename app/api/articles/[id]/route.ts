import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEditArticles } from "@/lib/auth";
import { ingestDebug } from "@/lib/ingest-debug";

function extractFirstImageSrc(html: string | null): string | null {
  if (!html) return null;
  const matches = Array.from(
    html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
  );
  if (matches.length === 1) {
    return matches[0][1];
  }
  return null;
}

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
    etatSlug,
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
  let finalContenuHtml: string | null = null;
  if (
    typeof contenuHtml === "string" ||
    typeof contenu === "string" ||
    contenuJson !== undefined
  ) {
    const computed: string =
      (typeof contenuHtml === "string" && contenuHtml.trim()) ||
      (typeof contenu === "string" && contenu.trim()) ||
      existing.contenu;
    finalContenuHtml = computed;
    data.contenu = computed.trim();
    if (contenuJson !== undefined) {
      data.contenuJson = contenuJson;
    }
  }
  if (etatId !== undefined) {
    data.etatId = etatId || null;
  } else if (typeof etatSlug === "string" && etatSlug.trim()) {
    const targetSlug = etatSlug.trim();
    let targetEtat = await prisma.etat.findFirst({ where: { slug: targetSlug } });
    if (!targetEtat && targetSlug === "brouillon") {
      targetEtat = await prisma.etat.create({
        data: { slug: "brouillon", libelle: "Brouillon", ordre: -1 },
      });
    }
    data.etatId = targetEtat?.id ?? null;
  }
  if (auteurId !== undefined && typeof auteurId === "string" && auteurId.trim()) {
    data.auteurId = auteurId.trim();
  }
  if (mutuelleId !== undefined) data.mutuelleId = mutuelleId || null;
  if (rubriqueId !== undefined) data.rubriqueId = rubriqueId || null;
  if (formatId !== undefined) data.formatId = formatId || null;
  if (legendePhoto !== undefined) data.legendePhoto = legendePhoto?.trim() || null;
  if (postRs !== undefined) data.postRs = postRs?.trim() || null;
  if (lienPhoto !== undefined) {
    data.lienPhoto = lienPhoto?.trim() || null;
  } else if (!existing.lienPhoto && finalContenuHtml != null) {
    const autoLienPhoto = extractFirstImageSrc(finalContenuHtml);
    if (autoLienPhoto) {
      data.lienPhoto = autoLienPhoto;
    }
  }
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
    if (
      etatCible?.slug !== "brouillon" &&
      !existing.dateDepot &&
      data.dateDepot === undefined
    ) {
      data.dateDepot = new Date();
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
    const etatCible = await prisma.etat.findUnique({
      where: { id: newEtatId },
      select: { slug: true, libelle: true },
    });

    await prisma.articleHistorique.create({
      data: {
        articleId: id,
        etatId: newEtatId,
        userId: user?.id ?? null,
      },
    });

    if (etatCible?.slug === "corrige") {
      try {
        const auteur = await prisma.auteur.findUnique({
          where: { id: article.auteurId },
          include: { user: true },
        });
        const email = (auteur as any)?.user?.email as string | undefined | null;
        if (email) {
          ingestDebug({
            sessionId: "fb943b",
            runId: "pre-fix",
            hypothesisId: "H_CORRIGE_EMAIL",
            location: "app/api/articles/[id]/route.ts:PATCH:beforeEmail",
            message: "Would send corrected article email",
            data: {
              articleId: id,
              email,
              titre: article.titre,
              etat: etatCible.libelle,
            },
          });
          // Ici, on pourrait brancher un vrai service d’e‑mail (Resend, SMTP, etc.).
        }
      } catch {
        // On ne bloque pas la requête si l’envoi d’e‑mail échoue.
      }
    }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.article.findUnique({
    where: { id },
    select: { id: true, auteurId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  const isAuthor = user.auteurId && user.auteurId === existing.auteurId;
  const isAdmin = user.role === "admin";

  if (!isAdmin && !isAuthor) {
    return NextResponse.json(
      { error: "Vous n’êtes pas autorisé à supprimer cet article." },
      { status: 403 }
    );
  }

  await prisma.article.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
