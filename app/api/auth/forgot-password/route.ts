import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildPasswordResetUrl,
  generatePasswordResetToken,
  getPasswordResetExpirationDate,
  hashPasswordResetToken,
  isValidEmail,
  normalizeEmail,
  sendPasswordResetEmail,
} from "@/lib/password-reset";

const GENERIC_MESSAGE =
  "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  const email = normalizeEmail(rawEmail);

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }

  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = getPasswordResetExpirationDate();

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    new URL(request.url).origin;
  const resetUrl = buildPasswordResetUrl(baseUrl, token);

  try {
    await sendPasswordResetEmail({ email: user.email, resetUrl });
  } catch {
    // On garde une réponse générique pour ne pas divulguer l'existence de comptes.
  }

  return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
}
