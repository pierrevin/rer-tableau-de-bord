import { redirect } from "next/navigation";
import { getSessionUser, canEditArticles } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSessionUser();

  if (user && canEditArticles(user.role)) {
    // Admin ou relecteur : file de relecture dédiée
    redirect("/admin/articles?etat=a_relire");
  }

  // Auteur / lecteur (ou visiteur non connecté) : explorateur d’articles
  redirect("/articles");
}

