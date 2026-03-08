import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { hashPasswordResetToken } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = (await request.json()) as { token?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password =
    typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }
  if (!password || password.length < 12) {
    return NextResponse.json(
      { error: "Mot de passe invalide (minimum 12 caractères)" },
      { status: 400 }
    );
  }

  const tokenHash = hashPasswordResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      usedAt: true,
      expiresAt: true,
    },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  const consumed = await prisma.passwordResetToken.updateMany({
    where: {
      id: resetToken.id,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  if (consumed.count !== 1) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.deleteMany({
    where: { userId: resetToken.userId },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
