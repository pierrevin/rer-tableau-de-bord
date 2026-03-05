"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeaderSecondary() {
  const pathname = usePathname();

  if (!pathname.startsWith("/articles")) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-rer-text">
          Liste des articles
        </h1>
        <p className="mt-1 text-sm text-rer-muted max-w-xl">
          Rechercher, filtrer par état ou par mutuelle, puis ouvrir un article
          pour le lire, le corriger ou l&apos;exporter.
        </p>
      </div>
      <Link
        href="/articles/depot"
        className="hidden items-center gap-2 rounded-full bg-rer-orange px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-[#e25730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rer-orange focus-visible:ring-offset-2 focus-visible:ring-offset-rer-app lg:inline-flex"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-base leading-none">
          +
        </span>
        <span>Nouvel article</span>
      </Link>
    </div>
  );
}

