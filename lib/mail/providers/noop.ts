import type { MailPayload, MailProvider } from "../types";

export function createNoopProvider(): MailProvider {
  return {
    name: "noop",
    async send(payload: MailPayload) {
      if (process.env.NODE_ENV !== "production") {
        console.info(
          `[mail:noop] to=${payload.to} subject="${payload.subject}"`
        );
      }
    },
  };
}
