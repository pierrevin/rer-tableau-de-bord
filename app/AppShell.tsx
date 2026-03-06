"use client";

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
                  src="/uploads/Logo_rer_noir-hd.jpg"
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

