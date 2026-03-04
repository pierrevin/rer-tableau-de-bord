import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const hasSearch = q.length >= 2;

  const [auteurs, mutuelles, rubriques, formats, etats] = await Promise.all([
    prisma.auteur.findMany({ orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    hasSearch
      ? prisma.mutuelle.findMany({
          where: { nom: { contains: q, mode: "insensitive" } },
          orderBy: { nom: "asc" },
          take: 10,
        })
      : prisma.mutuelle.findMany({ orderBy: { nom: "asc" } }),
    hasSearch
      ? prisma.rubrique.findMany({
          where: { libelle: { contains: q, mode: "insensitive" } },
          orderBy: { libelle: "asc" },
          take: 10,
        })
      : prisma.rubrique.findMany({ orderBy: { libelle: "asc" } }),
    hasSearch
      ? prisma.format.findMany({
          where: { libelle: { contains: q, mode: "insensitive" } },
          orderBy: { libelle: "asc" },
          take: 10,
        })
      : prisma.format.findMany({ orderBy: { libelle: "asc" } }),
    prisma.etat.findMany({ orderBy: { ordre: "asc" } }),
  ]);

  return NextResponse.json({
    auteurs,
    mutuelles,
    rubriques,
    formats,
    etats,
  });
}
