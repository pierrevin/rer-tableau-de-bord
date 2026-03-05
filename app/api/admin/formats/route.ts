import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const formats = await prisma.format.findMany({
    orderBy: { libelle: "asc" },
  });
  return NextResponse.json(formats);
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser || sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const body = await request.json();
  const { libelle, signesReference } = body as {
    libelle?: string;
    signesReference?: number | null;
  };
  if (!libelle || typeof libelle !== "string") {
    return NextResponse.json({ error: "Libellé obligatoire" }, { status: 400 });
  }

  const format = await prisma.format.create({
    data: {
      libelle: libelle.trim(),
      signesReference:
        typeof signesReference === "number" ? signesReference : null,
    },
  });
  return NextResponse.json(format, { status: 201 });
}

