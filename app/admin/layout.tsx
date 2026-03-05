import type { ReactNode } from "react";
import { RelecteursSidebar } from "../relecteurs/RelecteursSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
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

