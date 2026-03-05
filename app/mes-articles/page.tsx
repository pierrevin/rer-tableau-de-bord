import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MesArticlesPage() {
  // Pour le moment, on redirige simplement vers la liste des articles
  // avec un futur filtre `mine=1` (qui sera géré côté backend).
  redirect("/articles?mine=1");
}

