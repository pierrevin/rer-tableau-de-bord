import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser, canEditArticles } from "@/lib/auth";
import { RelecteursSidebar } from "./RelecteursSidebar";

export default async function RelecteursLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || !canEditArticles(user.role)) {
    redirect("/articles");
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-4 px-4 py-6 lg:gap-6 lg:py-8">
      <RelecteursSidebar />
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}

