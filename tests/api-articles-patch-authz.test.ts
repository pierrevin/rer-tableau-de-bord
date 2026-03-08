import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  articleFindUnique: vi.fn(),
  articleUpdate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSessionUser: mocks.getSessionUser,
  canEditArticles: (role: string | undefined) =>
    role === "admin" || role === "relecteur",
}));

vi.mock("@/lib/ingest-debug", () => ({
  ingestDebug: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findUnique: mocks.articleFindUnique,
      update: mocks.articleUpdate,
    },
    etat: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    articleHistorique: {
      create: vi.fn(),
    },
    auteur: {
      findUnique: vi.fn(),
    },
  },
}));

import { PATCH } from "@/app/api/articles/[id]/route";

describe("PATCH /api/articles/[id] - authz smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 401 si non authentifié", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    const response = await PATCH(
      {
        json: async () => ({ titre: "Nouveau titre" }),
      } as any,
      { params: Promise.resolve({ id: "a1" }) }
    );

    expect(response.status).toBe(401);
    expect(mocks.articleFindUnique).not.toHaveBeenCalled();
  });

  it("retourne 403 si auteur tente une transition d'état interdite", async () => {
    mocks.getSessionUser.mockResolvedValue({
      id: "u1",
      role: "auteur",
      auteurId: "author-1",
    });
    mocks.articleFindUnique.mockResolvedValue({
      id: "a1",
      auteurId: "author-1",
      etatId: null,
      datePublication: null,
      dateDepot: null,
      contenu: "<p>Contenu initial</p>",
      lienPhoto: null,
    });

    const response = await PATCH(
      {
        json: async () => ({ etatSlug: "valide" }),
      } as any,
      { params: Promise.resolve({ id: "a1" }) }
    );

    expect(response.status).toBe(403);
    expect(mocks.articleUpdate).not.toHaveBeenCalled();
  });
});
