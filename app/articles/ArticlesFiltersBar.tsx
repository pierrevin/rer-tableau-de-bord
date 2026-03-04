 "use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type SuggestionMutuelle = { id: string; nom: string };
type SuggestionRubrique = { id: string; libelle: string };
type SuggestionFormat = { id: string; libelle: string };
type SuggestionsResponse = {
  mutuelles: SuggestionMutuelle[];
  rubriques: SuggestionRubrique[];
  formats: SuggestionFormat[];
};

type FacetMutuelle = { id: string; nom: string; count: number };
type FacetRubrique = { id: string; libelle: string; count: number };
type FacetFormat = { id: string; libelle: string; count: number };

type FacetsResponse = {
  total: number;
  mutuelles: FacetMutuelle[];
  rubriques: FacetRubrique[];
  formats: FacetFormat[];
};

type ArticlesFiltersBarProps = {
  total: number;
  lastCreatedAt?: string | null;
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
  // Toujours revenir à la première page quand on change les filtres
  params.set("page", "1");
  return params.toString();
}

function formatDateLabel(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR");
}

function computeSinceForMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ArticlesFiltersBar({
  total,
  lastCreatedAt,
}: ArticlesFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialMutuelleIds =
    searchParams.get("mutuelleId")?.split(",").filter(Boolean) ?? [];
  const initialRubriqueIds =
    searchParams.get("rubriqueId")?.split(",").filter(Boolean) ?? [];
  const initialFormatIds =
    searchParams.get("formatId")?.split(",").filter(Boolean) ?? [];

  const initialSince = searchParams.get("since") ?? "";
  const initialFrom = searchParams.get("from") ?? "";
  const initialTo = searchParams.get("to") ?? "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [activeMutuelleIds, setActiveMutuelleIds] =
    useState<string[]>(initialMutuelleIds);
  const [activeRubriqueIds, setActiveRubriqueIds] =
    useState<string[]>(initialRubriqueIds);
  const [activeFormatIds, setActiveFormatIds] =
    useState<string[]>(initialFormatIds);

  const [datePreset, setDatePreset] = useState<"1m" | "3m" | "6m" | "custom" | null>(
    initialFrom || initialTo ? "custom" : initialSince ? null : null
  );
  const [customFrom, setCustomFrom] = useState(initialFrom);
  const [customTo, setCustomTo] = useState(initialTo);

  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [loadingFacets, setLoadingFacets] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const isFacetLabel = (s: string) =>
    /^(Mutuelle|Rubrique|Format)\s*:\s*\S+$/.test((s ?? "").trim());

  // Charger les suggestions (facettes filtrées localement) quand on tape
  useEffect(() => {
    const term = inputValue.trim();
    if (term.length < 2) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }
    if (isFacetLabel(term)) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    if (!facets) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    const lower = term.toLowerCase();
    const next: SuggestionsResponse = {
      mutuelles: facets.mutuelles.filter((m) =>
        m.nom.toLowerCase().includes(lower)
      ),
      rubriques: facets.rubriques.filter((r) =>
        r.libelle.toLowerCase().includes(lower)
      ),
      formats: facets.formats.filter((f) =>
        f.libelle.toLowerCase().includes(lower)
      ),
    };

    setSuggestions(next);
    setShowSuggestions(true);
    setLoadingSuggestions(false);
  }, [inputValue, facets]);

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasSuggestions =
    showSuggestions &&
    inputValue.trim().length >= 2 &&
    (loadingSuggestions || suggestions !== null);

  // Debounce de la recherche texte ; ne pas traiter un libellé de facette comme recherche
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const term = inputValue.trim();
      setDebouncedQ(isFacetLabel(term) ? "" : term);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [inputValue]);

  // Mettre à jour l'URL quand q change (via debounce) ; retirer display si on tape une vraie recherche
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentQ = params.get("q") ?? "";
    const qToApply = debouncedQ && !isFacetLabel(debouncedQ) ? debouncedQ : "";
    if (qToApply === currentQ) return;
    const next = buildSearchParams(params, {
      q: qToApply || null,
      display: null,
    });
    router.replace(`${pathname}?${next}`, { scroll: false });
  }, [debouncedQ, pathname, router, searchParams]);

  // Charger les facettes en fonction de q
  useEffect(() => {
    const controller = new AbortController();
    const fetchFacets = async () => {
      setLoadingFacets(true);
      try {
        const params = new URLSearchParams();
        if (debouncedQ) params.set("q", debouncedQ);
        if (activeMutuelleIds.length) {
          params.set("mutuelleId", activeMutuelleIds.join(","));
        }
        if (activeRubriqueIds.length) {
          params.set("rubriqueId", activeRubriqueIds.join(","));
        }
        if (activeFormatIds.length) {
          params.set("formatId", activeFormatIds.join(","));
        }
        const sinceParam = searchParams.get("since");
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");
        if (sinceParam) params.set("since", sinceParam);
        if (fromParam) params.set("from", fromParam);
        if (toParam) params.set("to", toParam);
        const res = await fetch(`/api/articles/facets?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setFacets(null);
          return;
        }
        const data = (await res.json()) as FacetsResponse;
        setFacets(data);
      } catch (e) {
        if (controller.signal.aborted) return;
        setFacets(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingFacets(false);
        }
      }
    };
    fetchFacets();
    return () => controller.abort();
  }, [debouncedQ, activeMutuelleIds, activeRubriqueIds, activeFormatIds, searchParams]);

  const derivedTotal = useMemo(() => {
    if (facets && debouncedQ.trim()) {
      return facets.total;
    }
    return total;
  }, [facets, debouncedQ, total]);

  const lastCreatedAtLabel = useMemo(
    () => formatDateLabel(lastCreatedAt),
    [lastCreatedAt]
  );

  const activeMutuelleFacets = useMemo(
    () =>
      facets?.mutuelles.filter((m) => activeMutuelleIds.includes(m.id)) ?? [],
    [facets, activeMutuelleIds]
  );

  const activeRubriqueFacets = useMemo(
    () =>
      facets?.rubriques.filter((r) => activeRubriqueIds.includes(r.id)) ?? [],
    [facets, activeRubriqueIds]
  );

  const activeFormatFacets = useMemo(
    () =>
      facets?.formats.filter((f) => activeFormatIds.includes(f.id)) ?? [],
    [facets, activeFormatIds]
  );

  const handleFacetToggle = (type: "mutuelle" | "rubrique" | "format", id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("display");
    const key =
      type === "mutuelle" ? "mutuelleId" : type === "rubrique" ? "rubriqueId" : "formatId";

    const current =
      type === "mutuelle"
        ? activeMutuelleIds
        : type === "rubrique"
        ? activeRubriqueIds
        : activeFormatIds;

    const exists = current.includes(id);
    const nextArray = exists ? current.filter((x) => x !== id) : [...current, id];

    if (type === "mutuelle") setActiveMutuelleIds(nextArray);
    if (type === "rubrique") setActiveRubriqueIds(nextArray);
    if (type === "format") setActiveFormatIds(nextArray);

    const nextValue = nextArray.length ? nextArray.join(",") : null;
    const next = buildSearchParams(params, { [key]: nextValue });
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  const hasActiveFacets =
    activeMutuelleIds.length || activeRubriqueIds.length || activeFormatIds.length;
  const hasActiveSearch = Boolean(debouncedQ.trim());
  const hasActiveDate =
    Boolean(searchParams.get("since")) ||
    Boolean(searchParams.get("from")) ||
    Boolean(searchParams.get("to"));
  const hasActiveFilters = hasActiveFacets || hasActiveSearch || hasActiveDate;

  const handleDatePresetClick = (preset: "1m" | "3m" | "6m") => {
    const params = new URLSearchParams(searchParams.toString());
    const since =
      preset === "1m"
        ? computeSinceForMonths(1)
        : preset === "3m"
        ? computeSinceForMonths(3)
        : computeSinceForMonths(6);
    setDatePreset(preset);
    setCustomFrom("");
    setCustomTo("");
    const next = buildSearchParams(params, {
      since,
      from: null,
      to: null,
    });
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  const handleCustomDateChange = (field: "from" | "to", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextFrom = field === "from" ? value : customFrom;
    const nextTo = field === "to" ? value : customTo;

    setDatePreset("custom");
    setCustomFrom(nextFrom);
    setCustomTo(nextTo);

    const next = buildSearchParams(params, {
      since: null,
      from: nextFrom || null,
      to: nextTo || null,
    });
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  const handleReset = () => {
    setInputValue("");
    setDebouncedQ("");
    setActiveMutuelleIds([]);
    setActiveRubriqueIds([]);
    setActiveFormatIds([]);
    setDatePreset(null);
    setCustomFrom("");
    setCustomTo("");
    router.replace(pathname, { scroll: false });
  };

  const applyFacetSuggestion = (
    type: "mutuelle" | "rubrique" | "format",
    id: string,
    label: string
  ) => {
    const key =
      type === "mutuelle" ? "mutuelleId" : type === "rubrique" ? "rubriqueId" : "formatId";
    const current =
      type === "mutuelle"
        ? activeMutuelleIds
        : type === "rubrique"
        ? activeRubriqueIds
        : activeFormatIds;
    const nextArray = current.includes(id) ? current : [...current, id];
    if (type === "mutuelle") setActiveMutuelleIds(nextArray);
    if (type === "rubrique") setActiveRubriqueIds(nextArray);
    if (type === "format") setActiveFormatIds(nextArray);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("display");
    params.set(key, nextArray.join(","));
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    setInputValue("");
    setDebouncedQ("");
    setShowSuggestions(false);
  };

  const applyTextSearch = () => {
    const term = inputValue.trim();
    if (term) {
      setDebouncedQ(term);
      const params = new URLSearchParams(searchParams.toString());
      const next = buildSearchParams(params, { q: term });
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
    setShowSuggestions(false);
  };

  return (
    <section aria-labelledby="filtres" className="mb-6 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <div ref={searchWrapperRef} className="relative flex-1 min-w-[220px] max-w-full">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="q"
              className="block text-xs font-medium uppercase tracking-wide text-slate-600"
            >
              Recherche texte
            </label>
            <input
              type="search"
              id="q"
              name="q"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onFocus={() => inputValue.trim().length >= 2 && setShowSuggestions(true)}
              placeholder="Titre, chapô, contenu, ou nom de mutuelle / rubrique / format..."
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              autoComplete="off"
              aria-expanded={hasSuggestions}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
            />
          </div>

          {hasSuggestions && (
            <div
              id="search-suggestions"
              role="listbox"
              className="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
            >
              {loadingSuggestions ? (
                <p className="px-3 py-2 text-xs text-slate-500">Recherche des suggestions…</p>
              ) : suggestions ? (
                <>
                  {suggestions.mutuelles.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="option"
                      onClick={() => applyFacetSuggestion("mutuelle", m.id, `Mutuelle : ${m.nom}`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                    >
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Mutuelle
                      </span>
                      <span>{m.nom}</span>
                    </button>
                  ))}
                  {suggestions.rubriques.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      role="option"
                      onClick={() => applyFacetSuggestion("rubrique", r.id, `Rubrique : ${r.libelle}`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                    >
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Rubrique
                      </span>
                      <span>{r.libelle}</span>
                    </button>
                  ))}
                  {suggestions.formats.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="option"
                      onClick={() => applyFacetSuggestion("format", f.id, `Format : ${f.libelle}`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                    >
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        Format
                      </span>
                      <span>{f.libelle}</span>
                    </button>
                  ))}
                  {(suggestions.mutuelles.length > 0 ||
                    suggestions.rubriques.length > 0 ||
                    suggestions.formats.length > 0) && (
                    <div className="border-t border-slate-100 px-2 pt-1">
                      <button
                        type="button"
                        role="option"
                        onClick={applyTextSearch}
                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Rechercher « {inputValue.trim()} » dans le texte (titre, chapô, contenu)
                      </button>
                    </div>
                  )}
                  {suggestions.mutuelles.length === 0 &&
                    suggestions.rubriques.length === 0 &&
                    suggestions.formats.length === 0 && (
                      <button
                        type="button"
                        role="option"
                        onClick={applyTextSearch}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Rechercher « {inputValue.trim()} » dans le texte
                      </button>
                    )}
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {derivedTotal} article{derivedTotal > 1 ? "s" : ""} trouvé
          {derivedTotal > 1 ? "s" : ""}.
          {debouncedQ && (
            <>
              {" "}
              Recherche sur <span className="font-semibold">« {debouncedQ} »</span>.
            </>
          )}
          {lastCreatedAtLabel && (
            <>
              {" "}
              <span className="text-[11px] text-slate-400">
                · Dernier article publié le {lastCreatedAtLabel}
              </span>
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
            >
              Réinitialiser tous les filtres
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
          >
            {isCollapsed ? "Afficher les filtres" : "Masquer les filtres"}
          </button>
        </div>
      </div>

      {(activeMutuelleFacets.length > 0 ||
        activeRubriqueFacets.length > 0 ||
        activeFormatFacets.length > 0) && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          {activeMutuelleFacets.map((m) => (
            <button
              key={`active-mutuelle-${m.id}`}
              type="button"
              onClick={() => handleFacetToggle("mutuelle", m.id)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white"
            >
              <span>{m.nom}</span>
              <span className="ml-0.5 text-[10px] opacity-80">· {m.count}</span>
              <span className="ml-1 text-[11px] leading-none">×</span>
            </button>
          ))}
          {activeRubriqueFacets.map((r) => (
            <button
              key={`active-rubrique-${r.id}`}
              type="button"
              onClick={() => handleFacetToggle("rubrique", r.id)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white"
            >
              <span>{r.libelle}</span>
              <span className="ml-1 text-[11px] leading-none">×</span>
            </button>
          ))}
          {activeFormatFacets.map((f) => (
            <button
              key={`active-format-${f.id}`}
              type="button"
              onClick={() => handleFacetToggle("format", f.id)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white"
            >
              <span>{f.libelle}</span>
              <span className="ml-1 text-[11px] leading-none">×</span>
            </button>
          ))}
        </div>
      )}

      {!isCollapsed && facets && (
        <div className="space-y-1 rounded-md border border-slate-200 bg-white/80 p-2 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-semibold text-slate-700">Mutuelles</span>
            {facets.mutuelles.length === 0 && (
              <span className="text-slate-400">Aucune distinction particulière</span>
            )}
            {facets.mutuelles.map((m) => {
              const active = activeMutuelleIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleFacetToggle("mutuelle", m.id)}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{m.nom}</span>
                  <span className="ml-1 text-[10px] opacity-80">· {m.count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="font-semibold text-slate-700">Rubriques</span>
            {facets.rubriques.length === 0 && (
              <span className="text-slate-400">Aucune distinction particulière</span>
            )}
            {facets.rubriques.map((r) => {
              const active = activeRubriqueIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleFacetToggle("rubrique", r.id)}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{r.libelle}</span>
                  <span className="ml-1 text-[10px] opacity-80">· {r.count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="font-semibold text-slate-700">Formats</span>
            {facets.formats.length === 0 && (
              <span className="text-slate-400">Aucune distinction particulière</span>
            )}
            {facets.formats.map((f) => {
              const active = activeFormatIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFacetToggle("format", f.id)}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{f.libelle}</span>
                  <span className="ml-1 text-[10px] opacity-80">· {f.count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="font-semibold text-slate-700">Dates</span>
            <button
              type="button"
              onClick={() => handleDatePresetClick("1m")}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs transition ${
                datePreset === "1m"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              Depuis 1 mois
            </button>
            <button
              type="button"
              onClick={() => handleDatePresetClick("3m")}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs transition ${
                datePreset === "3m"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              Depuis 3 mois
            </button>
            <button
              type="button"
              onClick={() => handleDatePresetClick("6m")}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs transition ${
                datePreset === "6m"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              Depuis 6 mois
            </button>
            <div className="ml-2 flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
              <span>Période personnalisée :</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => handleCustomDateChange("from", e.target.value)}
                className="h-6 rounded border border-slate-200 bg-white px-1 text-[11px]"
              />
              <span>au</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => handleCustomDateChange("to", e.target.value)}
                className="h-6 rounded border border-slate-200 bg-white px-1 text-[11px]"
              />
            </div>
          </div>

          {loadingFacets && (
            <p className="text-[10px] text-slate-400">Mise à jour des facettes…</p>
          )}
        </div>
      )}
    </section>
  );
}

