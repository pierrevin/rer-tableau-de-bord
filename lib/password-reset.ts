import { createHash, randomBytes } from "crypto";

const PASSWORD_RESET_TTL_MINUTES = 60;
const PASSWORD_RESET_WEBHOOK_URL = process.env.PASSWORD_RESET_WEBHOOK_URL?.trim();

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpirationDate(): Date {
  return new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
}

export function buildPasswordResetUrl(baseUrl: string, token: string): string {
  const url = new URL("/reset-password", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendPasswordResetEmail(options: {
  email: string;
  resetUrl: string;
}): Promise<void> {
  const subject = "Réinitialisation de votre mot de passe";
  const text = [
    "Bonjour,",
    "",
    "Vous avez demandé la réinitialisation de votre mot de passe.",
    `Utilisez ce lien (valide 60 minutes) : ${options.resetUrl}`,
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
  ].join("\n");

  if (PASSWORD_RESET_WEBHOOK_URL) {
    await fetch(PASSWORD_RESET_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: options.email,
        subject,
        text,
        html: `<p>Bonjour,</p><p>Vous avez demandé la réinitialisation de votre mot de passe.</p><p><a href="${options.resetUrl}">Réinitialiser mon mot de passe</a> (valide 60 minutes)</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
      }),
    });
    return;
  }

  // Fallback local/dev : journalise le lien pour permettre les tests sans fournisseur d’e-mail.
  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[password-reset] ${options.email} -> ${options.resetUrl}`
    );
  }
}
