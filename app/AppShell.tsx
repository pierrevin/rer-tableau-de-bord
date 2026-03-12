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
  const [logoUrl, setLogoUrl] = useState("/default-logo.svg");
  const [logoUnavailable, setLogoUnavailable] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let active = true;

    const loadLogo = async () => {
      try {
        const response = await fetch("/api/admin/logo", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { logoUrl?: string };
        if (active && payload.logoUrl) {
          setLogoUrl(payload.logoUrl);
          setLogoUnavailable(false);
        }
      } catch {
        // On conserve le logo par défaut si la récupération échoue.
      }
    };

    const handleLogoUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ logoUrl?: string }>;
      if (active && customEvent.detail?.logoUrl) {
        setLogoUrl(customEvent.detail.logoUrl);
        setLogoUnavailable(false);
      }
    };

    loadLogo();
    window.addEventListener("site-logo-updated", handleLogoUpdated as EventListener);

    return () => {
      active = false;
      window.removeEventListener("site-logo-updated", handleLogoUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (isLogin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`sticky top-0 z-40 border-b border-rer-border bg-white/90 backdrop-blur transition-[box-shadow,background-color] duration-200 ease-out ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div
          className={`mx-auto max-w-6xl px-4 ${
            isScrolled ? "py-2" : "py-3"
          } transition-[padding] duration-200 ease-out`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-rer-border bg-white">
                {!logoUnavailable ? (
                  <Image
                    src={logoUrl}
                    alt="Logo RER"
                    fill
                    sizes="48px"
                    className="object-contain p-2"
                    unoptimized
                    priority
                    onError={() => setLogoUnavailable(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold tracking-wide text-rer-muted">
                    RER
                  </div>
                )}
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="truncate text-sm font-semibold text-rer-text sm:text-base">
                  Base de données d’articles
                </span>
              </div>
            </Link>
            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 lg:w-auto lg:flex-nowrap lg:justify-end lg:gap-4">
              <div className="min-w-0 max-w-full overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">
                <AppMainNav />
              </div>
              <AppUserStatus />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <AppUserSwitchFooter />
    </div>
  );
}

