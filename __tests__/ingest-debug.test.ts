import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { shouldIngestDebug, ingestDebug } from "@/lib/ingest-debug";

describe("shouldIngestDebug", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalFlag = process.env.NEXT_PUBLIC_ENABLE_INGEST_DEBUG;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_INGEST_DEBUG;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_INGEST_DEBUG = originalFlag;
    }
  });

  it("returns true in development", () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_ENABLE_INGEST_DEBUG;
    expect(shouldIngestDebug()).toBe(true);
  });

  it("returns false in production without flag", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_ENABLE_INGEST_DEBUG;
    expect(shouldIngestDebug()).toBe(false);
  });

  it("returns true in production with flag set to 1", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_ENABLE_INGEST_DEBUG = "1";
    expect(shouldIngestDebug()).toBe(true);
  });
});

describe("ingestDebug", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response()))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not call fetch when debug is disabled", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_ENABLE_INGEST_DEBUG;

    ingestDebug({
      sessionId: "s1",
      runId: "r1",
      hypothesisId: "h1",
      location: "test",
      message: "hello",
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
