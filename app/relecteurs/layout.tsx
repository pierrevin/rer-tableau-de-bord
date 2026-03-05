import type { ReactNode } from "react";
import { RelecteursSidebar } from "./RelecteursSidebar";

export default function RelecteursLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl gap-4 px-4 py-6 lg:gap-6 lg:py-8">
      <RelecteursSidebar />
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}

