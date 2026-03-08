import type { MailPayload, MailProvider } from "../types";

type ResendConfig = {
  apiKey: string;
  from: string;
};

export function createResendProvider(config: ResendConfig): MailProvider {
  return {
    name: "resend",
    async send(payload: MailPayload) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
          tags: (payload.tags ?? []).map((value) => ({ name: "tag", value })),
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Resend provider error: ${response.status} ${response.statusText} ${detail}`
        );
      }
    },
  };
}
