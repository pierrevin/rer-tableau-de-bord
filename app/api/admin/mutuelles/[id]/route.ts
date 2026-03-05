import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser || sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { nom } = body as { nom?: string };

  const mutuelle = await prisma.mutuelle.update({
    where: { id },
    data: nom && typeof nom === "string" ? { nom: nom.trim() } : {},
  });
  return NextResponse.json(mutuelle);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser || sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.mutuelle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

