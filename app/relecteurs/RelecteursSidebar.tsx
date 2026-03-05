"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href?: string;
  label: string;
  description?: string;
  comingSoon?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/articles",
    label: "File d’articles",
    description: "Par état et actions rapides",
  },
  {
    href: "/admin/utilisateurs",
    label: "Utilisateurs",
    description: "Rôles et rattachements",
  },
  {
    href: "/admin/referentiels",
    label: "Référentiels",
    description: "Formats, rubriques, mutuelles, auteurs",
  },
  {
    label: "Statistiques",
    description: "Volumes, délais, répartition…",
    comingSoon: true,
  },
];

export function RelecteursSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  const containerBase =
    "flex min-h-screen flex-col border-r border-rer-border bg-white/95 px-2 py-3";
  const containerWidth = collapsed ? "w-16 items-center" : "w-64";

  return (
    <aside className={`${containerBase} ${containerWidth}`}>
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-rer-border bg-rer-app text-xs font-medium text-rer-muted hover:bg-white"
        aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
      >
        {collapsed ? "»" : "«"}
      </button>

      <div className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href && pathname === item.href.replace(/\?.*$/, "");
          const baseClasses =
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors";

          if (item.comingSoon) {
            return (
              <div
                key={item.label}
                className={`${baseClasses} cursor-not-allowed text-rer-muted`}
                aria-disabled="true"
                title="Bientôt disponible"
              >
                <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-rer-app text-[11px] font-semibold text-rer-muted">
                  {item.label.charAt(0)}
                </div>
                {!collapsed && (
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <span className="text-[11px] text-rer-subtle">
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }

          const href = item.href ?? "#";
          const activeClasses = isActive
            ? "bg-rer-blue text-white shadow-sm"
            : "text-rer-text hover:bg-rer-app";

          return (
            <Link
              key={item.label}
              href={href}
              className={`${baseClasses} ${activeClasses}`}
            >
              <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/70 text-[11px] font-semibold text-rer-blue">
                {item.label.charAt(0)}
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-[11px] text-rer-subtle">
                      {item.description}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

