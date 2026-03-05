import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function RelecteursPage() {
  // Pour le moment, page ouverte à tous qui réutilise la liste d’articles
  // en mode relecteur. On branchera les restrictions d’accès et le filtrage
  // avancé (états, etc.) quand les utilisateurs seront créés.
  redirect("/articles?view=explorer&mode=relecteur");
}

