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
  const data: Record<string, unknown> = {};

  if (typeof body.email === "string") {
    data.email = body.email.trim().toLowerCase();
  }
  if (typeof body.role === "string") {
    data.role = body.role;
  }
  if (body.auteurId !== undefined) {
    data.auteurId = body.auteurId || null;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json(user);
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

  await prisma.user.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}

