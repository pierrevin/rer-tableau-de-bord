import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [articles, auteurs, mutuelles] = await Promise.all([
    prisma.article.count(),
    prisma.auteur.count(),
    prisma.mutuelle.count(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-10 border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">
            RÉSEAU DES ÉDITEURS DE REVUES
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Base de données d&apos;articles
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Cherchez, lisez, téléchargez, publiez sur votre site&nbsp;!
          </p>
        </header>

        <section aria-labelledby="explorer" className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h2 id="explorer" className="text-lg font-semibold text-slate-900">
              Explorer la base
            </h2>
            <Link
              href="/articles"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Voir les articles
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white px-4 py-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-3xl font-semibold text-slate-900">{articles}</p>
              <p className="mt-1 text-sm text-slate-500">Articles</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-3xl font-semibold text-slate-900">{auteurs}</p>
              <p className="mt-1 text-sm text-slate-500">Auteurs</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-3xl font-semibold text-slate-900">{mutuelles}</p>
              <p className="mt-1 text-sm text-slate-500">Mutuelles</p>
            </div>
          </div>

          <div>
            <Link
              href="/articles"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Explorer la liste des articles
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

