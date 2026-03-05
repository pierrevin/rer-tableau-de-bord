import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
  });
  const auteurs = await prisma.auteur.findMany({
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });
  const mutuelles = await prisma.mutuelle.findMany({
    orderBy: { nom: "asc" },
  });
  return NextResponse.json({ users, auteurs, mutuelles });
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser || sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const body = await request.json();
  const { email, role, auteurId, prenom, nom, mutuelleId } = body as {
    email?: string;
    role?: string;
    auteurId?: string | null;
    prenom?: string;
    nom?: string;
    mutuelleId?: string | null;
  };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email obligatoire" }, { status: 400 });
  }

  if (!mutuelleId) {
    return NextResponse.json(
      { error: "Mutuelle obligatoire pour créer un utilisateur" },
      { status: 400 }
    );
  }

  let finalAuteurId = auteurId || null;

  // Si aucun auteur explicite n'est passé mais que l'on a prénom/nom,
  // on crée (ou réutilise) automatiquement une fiche Auteur associée.
  if (!finalAuteurId && prenom && nom) {
    const trimmedPrenom = prenom.trim();
    const trimmedNom = nom.trim();
    let auteur = await prisma.auteur.findFirst({
      where: { prenom: trimmedPrenom, nom: trimmedNom },
    });
    if (!auteur) {
      auteur = await prisma.auteur.create({
        data: {
          prenom: trimmedPrenom,
          nom: trimmedNom,
          email: email.trim().toLowerCase(),
          mutuelleId,
        },
      });
    } else if (mutuelleId) {
      auteur = await prisma.auteur.update({
        where: { id: auteur.id },
        data: { mutuelleId },
      });
    }
    finalAuteurId = auteur.id;
  }

  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      role: role && typeof role === "string" ? role : "auteur",
      auteurId: finalAuteurId,
    },
  });

  return NextResponse.json(user, { status: 201 });
}

