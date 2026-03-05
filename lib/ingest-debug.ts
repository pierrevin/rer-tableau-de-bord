/**
 * Indique si les appels de debug vers l’ingest (127.0.0.1:7402) doivent être exécutés.
 * En production, ils sont désactivés sauf si NEXT_PUBLIC_ENABLE_INGEST_DEBUG=1.
 * Évite timeouts et latence inutiles sur Vercel.
 */
export function shouldIngestDebug(): boolean {
  if (typeof process === "undefined") return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_INGEST_DEBUG === "1"
  );
}

const INGEST_URL = "http://127.0.0.1:7402/ingest/cd3f381d-1b5a-4cc6-8b78-0a0138a72f19";

export function ingestDebug(payload: {
  sessionId: string;
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
}): void {
  if (!shouldIngestDebug()) return;
  fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": payload.sessionId,
    },
    body: JSON.stringify({
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
