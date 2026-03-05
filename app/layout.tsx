import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import Link from "next/link";
import { AppHeaderSecondary } from "./AppHeaderSecondary";
import { AppMainNav } from "./AppMainNav";

export const metadata: Metadata = {
  title: "RER Tableau de bord",
  description: "Base de données d’articles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-screen bg-rer-app text-rer-text font-sans">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-rer-border bg-white/90 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-rer-border bg-white">
                    <Image
                      src="/uploads/Logo_rer_noir-hd.jpg"
                      alt="Logo RER"
                      fill
                      sizes="36px"
                      className="object-contain p-1"
                      priority
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold tracking-[0.18em] text-rer-muted">
                      RÉSEAU DES ÉDITEURS DE REVUES
                    </span>
                    <span className="text-sm font-semibold text-rer-text">
                      Base de données d’articles
                    </span>
                  </div>
                </Link>
                <AppMainNav />
              </div>
              <AppHeaderSecondary />
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
