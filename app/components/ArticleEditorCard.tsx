 "use client";

import { useEffect, useRef } from "react";
import RichArticleEditor from "./RichArticleEditor";

export type ArticleEditorValue = {
  formatId: string;
  rubriqueId: string;
  auteurId: string;
  mutuelleId?: string;
  lienPhoto?: string | null;
  legendePhoto?: string;
  titre: string;
  contenuHtml: string;
  contenuJson?: unknown | null;
  postRs?: string;
};

export type ArticleEditorReferentiels = {
  auteurs: { id: string; prenom: string; nom: string; mutuelleId?: string | null }[];
  mutuelles: { id: string; nom: string }[];
  rubriques: { id: string; libelle: string }[];
  formats: { id: string; libelle: string; signesReference: number | null }[];
};

type ArticleEditorCardProps = {
  mode?: "create" | "edit";
  value: ArticleEditorValue;
  referentiels: ArticleEditorReferentiels;
  onChange: (patch: Partial<ArticleEditorValue>) => void;
  onUploadMainImage: (file: File) => Promise<void>;
  editorKey?: number;
};

export function ArticleEditorCard({
  mode = "create",
  value,
  referentiels,
  onChange,
  onUploadMainImage,
  editorKey,
}: ArticleEditorCardProps) {
  const {
    formatId,
    rubriqueId,
    auteurId,
    mutuelleId,
    lienPhoto,
    legendePhoto,
    titre,
    contenuHtml,
    contenuJson,
    postRs,
  } = value;

  const signesRef = referentiels.formats.find((f) => f.id === formatId)?.signesReference;
  const plainFromHtml = (contenuHtml || "").replace(/<[^>]+>/g, " ");
  const signesCount = (plainFromHtml + (titre || "")).replace(/\s/g, "").length;

  const selectedAuteur: any =
    (referentiels.auteurs as any[]).find((a) => a.id === auteurId) ?? null;
  const selectedMutuelleName: string | null = (() => {
    const auteurMutuelleId =
      (selectedAuteur?.mutuelleId as string | undefined | null) ?? null;
    const effectiveMutuelleId = mutuelleId || auteurMutuelleId;
    if (!effectiveMutuelleId) return null;
    const m = referentiels.mutuelles.find((m) => m.id === effectiveMutuelleId);
    return m?.nom ?? null;
  })();

  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [titre]);

  const handleClearMainImage = () => {
    onChange({ lienPhoto: null, legendePhoto: "" });
  };

  const handleChooseMainImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;
      await onUploadMainImage(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Bloc image principale */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-rer-border">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-rer-muted">
          <span className="font-medium">Image principale</span>
          {lienPhoto && (
            <button
              type="button"
              onClick={handleClearMainImage}
              className="text-[11px] text-red-500 hover:underline"
            >
              Retirer l’image
            </button>
          )}
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            const target = e.target as HTMLElement | null;
            if (target && target.closest("button, input, textarea")) return;
            handleChooseMainImage();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleChooseMainImage();
            }
          }}
          className="rounded-xl border-2 border-dashed border-rer-border/70 bg-rer-app/40 px-4 py-4 text-xs text-rer-muted"
        >
          {lienPhoto ? (
            <div className="overflow-hidden rounded-xl border border-rer-border bg-rer-app">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lienPhoto}
                alt={legendePhoto || ""}
                className="h-64 w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <p>Glissez-déposez une image ici ou cliquez pour choisir un fichier.</p>
            </div>
          )}
        </div>
        {lienPhoto && (
          <div className="mt-3">
            <input
              type="text"
              value={legendePhoto || ""}
              onChange={(e) => onChange({ legendePhoto: e.target.value })}
              placeholder="Légende de l’image principale…"
              className="w-full rounded-md border border-rer-border px-2 py-1 text-xs text-rer-text placeholder:text-rer-muted focus:border-rer-blue focus:outline-none focus:ring-1 focus:ring-rer-blue"
            />
          </div>
        )}
      </section>

      {/* Carte principale : méta + titre + contenu */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-rer-border">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-rer-muted">
            {/* Format */}
            <div className="relative inline-flex items-center">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
                  <span className="truncate">
                    {formatId
                      ? (() => {
                          const f = referentiels.formats.find((fmt) => fmt.id === formatId);
                          if (!f) return "Choisir un format";
                          const extra =
                            f.signesReference != null ? ` (${f.signesReference} signes)` : "";
                          return `${f.libelle}${extra}`;
                        })()
                      : "Choisir un format"}
                  </span>
                  <span className="text-[9px]">▾</span>
                </summary>
                <div className="absolute z-20 mt-2 w-64 rounded-xl border border-blue-200 bg-white py-1 text-[12px] shadow-lg">
                  {referentiels.formats.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onChange({ formatId: f.id })}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-blue-50 ${
                        formatId === f.id ? "font-semibold text-blue-700" : "text-rer-text"
                      }`}
                    >
                      <span>{f.libelle}</span>
                      {f.signesReference != null && (
                        <span className="ml-2 text-[11px] text-rer-muted">
                          {f.signesReference} signes
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </details>
            </div>

            {/* Rubrique */}
            <div className="relative inline-flex items-center">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                  <span className="truncate">
                    {rubriqueId
                      ? (() => {
                          const r = referentiels.rubriques.find((rb) => rb.id === rubriqueId);
                          return r?.libelle ?? "Choisir une rubrique";
                        })()
                      : "Choisir une rubrique"}
                  </span>
                  <span className="text-[9px]">▾</span>
                </summary>
                <div className="absolute z-20 mt-2 w-56 rounded-xl border border-emerald-200 bg-white py-1 text-[12px] shadow-lg">
                  {referentiels.rubriques.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onChange({ rubriqueId: r.id })}
                      className={`flex w-full items-center px-3 py-1.5 text-left hover:bg-emerald-50 ${
                        rubriqueId === r.id ? "font-semibold text-emerald-700" : "text-rer-text"
                      }`}
                    >
                      {r.libelle}
                    </button>
                  ))}
                </div>
              </details>
            </div>

            {/* Signature */}
            <div className="relative inline-flex items-center">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-700">
                  <span className="truncate">
                    {auteurId
                      ? (() => {
                          const a = (referentiels.auteurs as any[]).find(
                            (aut) => aut.id === auteurId
                          );
                          if (!a) return "Choisir une signature";
                          const labelMutuelle = selectedMutuelleName
                            ? ` – ${selectedMutuelleName}`
                            : "";
                          return `${a.prenom} ${a.nom}${labelMutuelle}`;
                        })()
                      : "Choisir une signature"}
                  </span>
                  <span className="text-[9px]">▾</span>
                </summary>
                <div className="absolute z-20 mt-2 w-64 rounded-xl border border-purple-200 bg-white py-1 text-[12px] shadow-lg">
                  {referentiels.auteurs.map((a) => {
                    const mId = (a as any).mutuelleId as string | undefined;
                    const mutuelle =
                      mId && referentiels.mutuelles.find((m) => m.id === mId)?.nom;
                    const label = mutuelle
                      ? `${a.prenom} ${a.nom} – ${mutuelle}`
                      : `${a.prenom} ${a.nom}`;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            auteurId: a.id,
                            mutuelleId: mId || undefined,
                          })
                        }
                        className={`flex w-full items-center px-3 py-1.5 text-left hover:bg-purple-50 ${
                          auteurId === a.id ? "font-semibold text-purple-700" : "text-rer-text"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </details>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              ref={titleRef}
              value={titre}
              onChange={(e) => onChange({ titre: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const proseMirror =
                    document.querySelector<HTMLElement>(".ProseMirror");
                  proseMirror?.focus();
                }
              }}
              required
              placeholder="Titre de l’article"
              rows={1}
              className="w-full resize-none border-none bg-transparent text-3xl font-semibold leading-tight text-rer-text placeholder:text-rer-muted focus:outline-none focus:ring-0"
            />
            <p className="text-[11px] text-rer-muted">
              Astuce&nbsp;: sur une ligne vide dans le texte, tapez «&nbsp;/&nbsp;» pour insérer
              une image, un embed ou appliquer un style (H2, H3, citation).
            </p>
            <RichArticleEditor
              key={editorKey}
              chrome="none"
              initialHtml={contenuHtml}
              initialJson={contenuJson ?? undefined}
              onChange={({ json, html }) => {
                onChange({ contenuJson: json, contenuHtml: html });
              }}
              className="min-h-[420px]"
            />
          </div>

          {signesRef != null && (
            <div
              className={`flex items-center justify-end text-[11px] ${
                signesCount > (signesRef ?? 0) ? "text-red-600 font-medium" : "text-gray-500"
              }`}
            >
              <span>
                Signes : {signesCount} / {signesRef}{" "}
                {typeof signesRef === "number" &&
                  `(${signesRef - signesCount} restants)${
                    signesCount > signesRef ? " – au‑delà du format" : ""
                  }`}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Bloc Post réseaux sociaux */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-rer-border">
        <div className="rounded-md bg-rer-app p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Post réseaux sociaux
          </p>
          <textarea
            value={postRs || ""}
            onChange={(e) => onChange({ postRs: e.target.value })}
            rows={4}
            placeholder="Proposition de texte pour les réseaux sociaux…"
            className="w-full resize-none rounded-md border border-rer-border bg-white px-2 py-1 text-sm text-rer-text placeholder:text-rer-muted focus:border-rer-blue focus:outline-none focus:ring-1 focus:ring-rer-blue"
          />
        </div>
      </section>
    </div>
  );
}

export default ArticleEditorCard;

