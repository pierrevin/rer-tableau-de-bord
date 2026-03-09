"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppMainNav } from "./AppMainNav";
import { AppUserStatus } from "./AppUserStatus";
import { AppHeaderSecondary } from "./AppHeaderSecondary";
import { AppUserSwitchFooter } from "./AppUserSwitchFooter";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const [logoUrl, setLogoUrl] = useState("/uploads/Logo_rer_noir-hd.jpg");

  useEffect(() => {
    let active = true;

    const loadLogo = async () => {
      try {
        const response = await fetch("/api/admin/logo", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { logoUrl?: string };
        if (active && payload.logoUrl) {
          setLogoUrl(payload.logoUrl);
        }
      } catch {
        // On conserve le logo par défaut si la récupération échoue.
      }
    };

    const handleLogoUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ logoUrl?: string }>;
      if (active && customEvent.detail?.logoUrl) {
        setLogoUrl(customEvent.detail.logoUrl);
      }
    };

    loadLogo();
    window.addEventListener("site-logo-updated", handleLogoUpdated as EventListener);

    return () => {
      active = false;
      window.removeEventListener("site-logo-updated", handleLogoUpdated as EventListener);
    };
  }, []);

  if (isLogin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rer-border bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-rer-border bg-white">
                <Image
                  src={logoUrl}
                  alt="Logo RER"
                  fill
                  sizes="48px"
                  className="object-contain p-2"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-rer-text">
                  Base de données d’articles
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <AppMainNav />
              <AppUserStatus />
            </div>
          </div>
          <AppHeaderSecondary />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <AppUserSwitchFooter />
    </div>
  );
}

