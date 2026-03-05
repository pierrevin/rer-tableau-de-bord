"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph";

type RichArticleEditorProps = {
  /**
   * Contenu initial au format JSON Tiptap (recommandé).
   */
  initialJson?: unknown;
  /**
   * Contenu initial au format HTML (fallback / compatibilité).
   */
  initialHtml?: string | null;
  /**
   * Mode lecture seule.
   */
  readOnly?: boolean;
  /**
   * Callback appelé à chaque mise à jour significative.
   */
  onChange?: (payload: { json: unknown; html: string }) => void;
  /**
   * Classes supplémentaires pour le conteneur externe.
   */
  className?: string;
};

export function RichArticleEditor({
  initialJson,
  initialHtml,
  readOnly = false,
  onChange,
  className = "",
}: RichArticleEditorProps) {
  const editor = useEditor({
    extensions: [
      Paragraph.extend({
        addAttributes() {
          return {
            ...(this.parent?.() || {}),
            class: {
              default: null,
              parseHTML: (element) => element.getAttribute("class"),
              renderHTML: (attributes) => {
                if (!attributes.class) return {};
                return { class: attributes.class };
              },
            },
          };
        },
      }),
      StarterKit.configure({
        paragraph: false,
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
    ],
    content: initialJson ?? initialHtml ?? "",
    editable: !readOnly,
    autofocus: false,
    // Important pour Next.js / SSR : éviter les divergences de rendu
    // entre serveur et client comme recommandé par Tiptap.
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (!onChange) return;
      const json = editor.getJSON();
      const html = editor.getHTML();

      // #region agent log
      fetch("http://127.0.0.1:7402/ingest/cd3f381d-1b5a-4cc6-8b78-0a0138a72f19", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "fb943b",
        },
        body: JSON.stringify({
          sessionId: "fb943b",
          runId: "pre-fix",
          hypothesisId: "H_AUTOSAVE_OR_ONCHANGE",
          location: "app/components/RichArticleEditor.tsx:onUpdate",
          message: "RichArticleEditor onUpdate called",
          data: {
            htmlLength: html.length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      onChange({ json, html });
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  if (!editor) return null;

  const baseButtonClasses =
    "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors";

  const handleInsertImage = () => {
    if (!editor) return;
    const url = window.prompt("URL de l’image à insérer");
    if (!url) return;
    const caption = window.prompt("Légende (optionnelle)") ?? "";
    const safeUrl = url.trim();
    if (!safeUrl) return;
    editor
      .chain()
      .focus()
      .insertContent(
        `<figure><img src="${safeUrl}" alt="${caption ?? ""}" />${
          caption ? `<figcaption>${caption}</figcaption>` : ""
        }</figure>`
      )
      .run();
  };

  const handleInsertSocial = () => {
    if (!editor) return;
    const url = window.prompt("URL du post réseaux sociaux (Twitter, LinkedIn…)") ?? "";
    const safeUrl = url.trim();
    if (!safeUrl) return;
    editor
      .chain()
      .focus()
      .insertContent(`<p class="social-embed">${safeUrl}</p>`)
      .run();
  };

  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL du lien", previousUrl ?? "") ?? "";
    const safeUrl = url.trim();
    if (!safeUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: safeUrl }).run();
  };

  const handleToggleChapo = () => {
    if (!editor) return;
    const attrs = editor.getAttributes("paragraph") || {};
    const currentClass: string = attrs.class || "";
    const classes = currentClass
      .split(" ")
      .map((c: string) => c.trim())
      .filter(Boolean);
    const hasChapo = classes.includes("chapo");
    const nextClasses = hasChapo
      ? classes.filter((c: string) => c !== "chapo")
      : [...classes, "chapo"];

    // #region agent log
    fetch("http://127.0.0.1:7402/ingest/cd3f381d-1b5a-4cc6-8b78-0a0138a72f19", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "fb943b",
      },
      body: JSON.stringify({
        sessionId: "fb943b",
        runId: "pre-fix",
        hypothesisId: "H_CHAPO_TOGGLE",
        location: "app/components/RichArticleEditor.tsx:handleToggleChapo",
        message: "Toggle chapo clicked",
        data: {
          beforeClasses: classes,
          afterClasses: nextClasses,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    editor
      .chain()
      .focus()
      .updateAttributes("paragraph", {
        class: nextClasses.join(" ") || null,
      })
      .run();
  };

  return (
    <div
      className={`rounded-xl border border-rer-border bg-white px-3 py-2 text-sm text-rer-text shadow-sm ${className}`}
    >
      {!readOnly && (
        <div className="mb-2 flex flex-wrap gap-1 text-xs">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`${baseButtonClasses} ${
              editor.isActive("bold")
                ? "bg-rer-blue text-white border-rer-blue"
                : "bg-white text-rer-text border-rer-border hover:bg-rer-app"
            }`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`${baseButtonClasses} ${
              editor.isActive("italic")
                ? "bg-rer-blue text-white border-rer-blue"
                : "bg-white text-rer-text border-rer-border hover:bg-rer-app"
            }`}
          >
            I
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`${baseButtonClasses} ${
              editor.isActive("heading", { level: 2 })
                ? "bg-rer-blue text-white border-rer-blue"
                : "bg-white text-rer-text border-rer-border hover:bg-rer-app"
            }`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`${baseButtonClasses} ${
              editor.isActive("heading", { level: 3 })
                ? "bg-rer-blue text-white border-rer-blue"
                : "bg-white text-rer-text border-rer-border hover:bg-rer-app"
            }`}
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${baseButtonClasses} ${
              editor.isActive("bulletList")
                ? "bg-rer-blue text-white border-rer-blue"
                : "bg-white text-rer-text border-rer-border hover:bg-rer-app"
            }`}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${baseButtonClasses} ${
              editor.isActive("blockquote")
                ? "bg-rer-blue text-white border-rer-blue"
                : "bg-white text-rer-text border-rer-border hover:bg-rer-app"
            }`}
          >
            Citation
          </button>
          <button
            type="button"
            onClick={handleToggleChapo}
            className={`${baseButtonClasses} ${
              editor.isActive("paragraph", { class: "chapo" })
                ? "bg-rer-blue text-white border-rer-blue"
                : "bg-white text-rer-text border-rer-border hover:bg-rer-app"
            }`}
          >
            Chapô
          </button>
        </div>
      )}

      {!readOnly && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex gap-1 rounded-full bg-rer-text px-3 py-1.5 text-[12px] text-white shadow-md"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "font-bold" : ""}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "italic" : ""}
          >
            I
          </button>
          <button
            type="button"
            onClick={handleSetLink}
          >
            Lien
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={editor.isActive("heading", { level: 2 }) ? "font-semibold" : ""}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={editor.isActive("heading", { level: 3 }) ? "font-semibold" : ""}
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "underline" : ""}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "italic" : ""}
          >
            Citation
          </button>
          <button
            type="button"
            onClick={handleToggleChapo}
            className={editor.isActive("paragraph", { class: "chapo" }) ? "font-semibold underline" : ""}
          >
            Chapô
          </button>
        </BubbleMenu>
      )}

      <div className="prose prose-sm max-w-none text-rer-text prose-h2:text-xl prose-h2:font-semibold prose-h3:text-lg prose-h3:font-semibold prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-blockquote:border-l-2 prose-blockquote:border-rer-blue prose-blockquote:pl-3 prose-blockquote:text-rer-text focus:outline-none">
        <EditorContent editor={editor} />
      </div>

      {!readOnly && (
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-rer-muted">
          <button
            type="button"
            onClick={handleInsertImage}
            className="inline-flex items-center rounded-full border border-dashed border-rer-border px-2.5 py-1 hover:bg-rer-app"
          >
            + Image
          </button>
          <button
            type="button"
            onClick={handleInsertSocial}
            className="inline-flex items-center rounded-full border border-dashed border-rer-border px-2.5 py-1 hover:bg-rer-app"
          >
            + Post réseaux sociaux
          </button>
        </div>
      )}
    </div>
  );
}

export default RichArticleEditor;

