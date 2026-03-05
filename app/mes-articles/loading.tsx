export default function MesArticlesLoading() {
  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center gap-2 py-16 text-rer-muted">
          <span
            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-rer-blue border-t-transparent"
            aria-hidden
          />
          <span>Chargement de mes articles…</span>
        </div>
      </div>
    </main>
  );
}
