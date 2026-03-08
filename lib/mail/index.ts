import { createNoopProvider } from "./providers/noop";
import { createResendProvider } from "./providers/resend";
import { createWebhookProvider } from "./providers/webhook";
import type { MailPayload, MailProvider, MailProviderName } from "./types";

const MAIL_PROVIDER = ((process.env.MAIL_PROVIDER || "auto").trim().toLowerCase() ||
  "auto") as MailProviderName;

const MAIL_WEBHOOK_URL =
  process.env.MAIL_WEBHOOK_URL?.trim() ||
  process.env.PASSWORD_RESET_WEBHOOK_URL?.trim() ||
  "";

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || "";
const MAIL_FROM = process.env.MAIL_FROM?.trim() || "";

let cachedProvider: MailProvider | null = null;

function resolveProvider(): MailProvider {
  if (cachedProvider) return cachedProvider;

  if (MAIL_PROVIDER === "webhook") {
    if (!MAIL_WEBHOOK_URL) {
      throw new Error("MAIL_WEBHOOK_URL manquant pour MAIL_PROVIDER=webhook");
    }
    cachedProvider = createWebhookProvider(MAIL_WEBHOOK_URL);
    return cachedProvider;
  }

  if (MAIL_PROVIDER === "resend") {
    if (!RESEND_API_KEY || !MAIL_FROM) {
      throw new Error(
        "RESEND_API_KEY ou MAIL_FROM manquant pour MAIL_PROVIDER=resend"
      );
    }
    cachedProvider = createResendProvider({
      apiKey: RESEND_API_KEY,
      from: MAIL_FROM,
    });
    return cachedProvider;
  }

  if (MAIL_PROVIDER === "smtp") {
    throw new Error(
      "MAIL_PROVIDER=smtp est réservé: branchez votre implémentation SMTP."
    );
  }

  // auto / noop
  if (MAIL_WEBHOOK_URL) {
    cachedProvider = createWebhookProvider(MAIL_WEBHOOK_URL);
    return cachedProvider;
  }

  if (RESEND_API_KEY && MAIL_FROM) {
    cachedProvider = createResendProvider({
      apiKey: RESEND_API_KEY,
      from: MAIL_FROM,
    });
    return cachedProvider;
  }

  cachedProvider = createNoopProvider();
  return cachedProvider;
}

export async function sendMail(payload: MailPayload): Promise<void> {
  const provider = resolveProvider();
  await provider.send(payload);
}
