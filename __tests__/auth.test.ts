import { describe, it, expect } from "vitest";
import { canEditArticles } from "@/lib/auth";

describe("canEditArticles", () => {
  it("returns true for admin role", () => {
    expect(canEditArticles("admin")).toBe(true);
  });

  it("returns true for relecteur role", () => {
    expect(canEditArticles("relecteur")).toBe(true);
  });

  it("returns false for auteur role", () => {
    expect(canEditArticles("auteur")).toBe(false);
  });

  it("returns false for lecteur role", () => {
    expect(canEditArticles("lecteur")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(canEditArticles(undefined)).toBe(false);
  });
});
