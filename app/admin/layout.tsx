import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser, canEditArticles } from "@/lib/auth";
import { RelecteursSidebar } from "../relecteurs/RelecteursSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user || !canEditArticles(user.role)) {
    // Auteurs / lecteurs : pas d’accès à l’espace admin
    redirect("/articles");
  }

  return (
    <div className="flex min-h-screen bg-rer-app">
      <RelecteursSidebar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
          <div className="min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

