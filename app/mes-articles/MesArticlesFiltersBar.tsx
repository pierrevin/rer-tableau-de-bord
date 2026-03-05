"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type EtatOption = {
  id: string;
  slug: string;
  libelle: string;
};

type MesArticlesFiltersBarProps = {
  total: number;
  etats: EtatOption[];
  currentEtatSlug: string;
  currentSort: string;
};

function buildSearchParams(
  searchParams: URLSearchParams,
  updates: Record<string, string | null>
): string {
  const params = new URLSearchParams(searchParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });
  params.set("page", "1");
  return params.toString();
}

export function MesArticlesFiltersBar({
  total,
  etats,
  currentEtatSlug,
  currentSort,
}: MesArticlesFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (field: "etat" | "sort", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = buildSearchParams(params, {
      [field]: value || null,
    });
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-rer-border">
      <div className="text-xs text-rer-muted">
        {total} article{total > 1 ? "s" : ""} au total.
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-rer-muted">
            État
          </span>
          <select
            value={currentEtatSlug}
            onChange={(event) => handleChange("etat", event.target.value)}
            className="h-7 rounded-md border border-rer-border bg-white px-2 text-xs text-rer-text focus:border-rer-blue focus:outline-none focus:ring-1 focus:ring-rer-blue"
          >
            <option value="">Tous les états</option>
            {etats.map((etat) => (
              <option key={etat.id} value={etat.slug}>
                {etat.libelle}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-rer-muted">
            Trier par
          </span>
          <select
            value={currentSort}
            onChange={(event) => handleChange("sort", event.target.value)}
            className="h-7 rounded-md border border-rer-border bg-white px-2 text-xs text-rer-text focus:border-rer-blue focus:outline-none focus:ring-1 focus:ring-rer-blue"
          >
            <option value="lastModifiedDesc">Dernière modification (récent d&apos;abord)</option>
            <option value="lastModifiedAsc">Dernière modification (ancien d&apos;abord)</option>
            <option value="dateDepotDesc">Date de dépôt (récent d&apos;abord)</option>
            <option value="dateDepotAsc">Date de dépôt (ancien d&apos;abord)</option>
            <option value="etat">État</option>
          </select>
        </label>
      </div>
    </section>
  );
}

