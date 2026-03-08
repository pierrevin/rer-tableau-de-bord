import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isValidRole } from "@/lib/auth";

const userSafeSelect = {
  id: true,
  email: true,
  role: true,
  auteurId: true,
  createdAt: true,
  updatedAt: true,
};

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
    if (!isValidRole(body.role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    data.role = body.role;
  }
  if (body.auteurId !== undefined) {
    data.auteurId = body.auteurId || null;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: userSafeSelect,
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

