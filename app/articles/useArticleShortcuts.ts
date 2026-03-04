 "use client";

import { useEffect } from "react";

type ShortcutArticle = { id: string };

type UseArticleShortcutsOptions = {
  articles: ShortcutArticle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenFull: (id: string) => void;
  onExportWord: (id: string) => void;
};

export function useArticleShortcuts({
  articles,
  selectedId,
  onSelect,
  onOpenFull,
  onExportWord,
}: UseArticleShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName;
      const isTypingContext =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true";

      if (isTypingContext) {
        return;
      }

      if (!articles.length) return;

      const currentIndex = selectedId
        ? articles.findIndex((a) => a.id === selectedId)
        : -1;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex =
          currentIndex < 0
            ? 0
            : Math.min(currentIndex + 1, articles.length - 1);
        const next = articles[nextIndex];
        if (next) onSelect(next.id);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const prevIndex =
          currentIndex < 0
            ? articles.length - 1
            : Math.max(currentIndex - 1, 0);
        const prev = articles[prevIndex];
        if (prev) onSelect(prev.id);
        return;
      }

      if (event.key === "Enter" && selectedId) {
        event.preventDefault();
        onOpenFull(selectedId);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && (event.key === "e" || event.key === "E") && selectedId) {
        event.preventDefault();
        onExportWord(selectedId);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [articles, selectedId, onSelect, onOpenFull, onExportWord]);
}

