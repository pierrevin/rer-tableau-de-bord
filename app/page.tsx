import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [articles, auteurs, mutuelles] = await Promise.all([
    prisma.article.count(),
    prisma.auteur.count(),
    prisma.mutuelle.count(),
  ]);

  return (
    <main>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-10 border-b border-rer-border pb-6">
          <h1 className="text-3xl font-extrabold text-rer-text">
            Tableau de bord des articles
          </h1>
          <p className="mt-2 text-sm text-rer-muted">
            Cherchez, lisez, téléchargez et publiez des contenus éditoriaux
            mutualisés pour votre revue.
          </p>
        </header>

        <section aria-labelledby="explorer" className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h2 id="explorer" className="text-lg font-semibold text-rer-text">
              Explorer la base
            </h2>
            <Link
              href="/articles"
              className="rounded-full bg-rer-orange px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#e25730] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rer-orange focus-visible:ring-offset-2 focus-visible:ring-offset-rer-app"
            >
              Voir les articles
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-rer-border">
              <p className="text-3xl font-semibold text-rer-text">{articles}</p>
              <p className="mt-1 text-sm text-rer-muted">Articles</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-rer-border">
              <p className="text-3xl font-semibold text-rer-text">{auteurs}</p>
              <p className="mt-1 text-sm text-rer-muted">Auteurs</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-rer-border">
              <p className="text-3xl font-semibold text-rer-text">{mutuelles}</p>
              <p className="mt-1 text-sm text-rer-muted">Mutuelles</p>
            </div>
          </div>

          <div>
            <Link
              href="/articles"
              className="inline-flex items-center rounded-full border border-rer-border bg-white px-4 py-2 text-sm font-medium text-rer-text hover:bg-rer-app/60"
            >
              Explorer la liste des articles
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

