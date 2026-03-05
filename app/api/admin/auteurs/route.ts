import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const auteurs = await prisma.auteur.findMany({
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    include: { mutuelle: true },
  });
  const mutuelles = await prisma.mutuelle.findMany({
    orderBy: { nom: "asc" },
  });
  return NextResponse.json({ auteurs, mutuelles });
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser || sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const body = await request.json();
  const { prenom, nom, email, mutuelleId } = body as {
    prenom?: string;
    nom?: string;
    email?: string | null;
    mutuelleId?: string | null;
  };

  if (!prenom || !nom || !mutuelleId) {
    return NextResponse.json(
      { error: "Prénom, nom et mutuelle sont obligatoires" },
      { status: 400 }
    );
  }

  const auteur = await prisma.auteur.create({
    data: {
      prenom: prenom.trim(),
      nom: nom.trim(),
      email: email?.trim() || null,
      mutuelleId,
    },
  });

  return NextResponse.json(auteur, { status: 201 });
}

