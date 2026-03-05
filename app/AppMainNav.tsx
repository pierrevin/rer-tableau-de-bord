"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppMainNav() {
  const pathname = usePathname();

  const isOnArticles = pathname.startsWith("/articles");
  const isOnMesArticles = pathname.startsWith("/mes-articles");
  const isOnRelecteurs = pathname.startsWith("/relecteurs");

  const baseClasses =
    "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors";
  const inactiveClasses =
    "text-rer-muted hover:text-rer-text hover:bg-rer-app";
  const activeClasses = "bg-rer-blue text-white shadow-sm";

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        href="/articles"
        className={`${baseClasses} ${
          isOnArticles && !isOnMesArticles ? activeClasses : inactiveClasses
        }`}
      >
        Articles
      </Link>
      <Link
        href="/mes-articles"
        className={`${baseClasses} ${
          isOnMesArticles ? activeClasses : inactiveClasses
        }`}
      >
        Mes articles
      </Link>
      <Link
        href="/relecteurs"
        className={`${baseClasses} ${
          isOnRelecteurs ? activeClasses : inactiveClasses
        }`}
      >
        Relecteurs
      </Link>
    </nav>
  );
}

