"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

const enableUserSwitch =
  process.env.NEXT_PUBLIC_ENABLE_USER_SWITCH === "1";

type UserSummary = {
  id: string;
  email: string;
  role: string;
};

export function AppUserSwitchFooter() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const shouldHide = pathname === "/login" || !enableUserSwitch;

  useEffect(() => {
    if (shouldHide) return;
    if (!session?.user) return;
    if (session.user.role !== "admin") return;
    if (users.length > 0 || loadingUsers) return;

    setLoadingUsers(true);
    fetch("/api/admin/users")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const next: UserSummary[] = (data.users ?? []).map(
          (u: { id: string; email: string; role: string }) => ({
            id: u.id,
            email: u.email,
            role: u.role,
          })
        );
        setUsers(next);
      })
      .catch(() => {
        // silencieux pour le moment
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, [loadingUsers, session?.user, shouldHide, users.length]);

  const handleSwitchUser = async (userId: string) => {
    if (!userId) return;
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    // Passer l’admin courant pour que la nouvelle session garde la trace (footer toujours visible)
    const currentSession = session as { user: { id: string; email: string }; originalUserEmail?: string | null; originalUserId?: string | null };
    const originalEmail = currentSession.originalUserEmail ?? currentSession.user.email;
    const originalId = currentSession.originalUserId ?? currentSession.user.id;

    await signIn("impersonate", {
      email: target.email,
      originalUserEmail: originalEmail,
      originalUserId: originalId,
      redirect: true,
      callbackUrl: pathname || "/",
    });
  };

  const handleRevert = async () => {
    const currentSession = session as { originalUserEmail?: string | null };
    const email = currentSession.originalUserEmail;
    if (!email) return;
    await signIn("impersonate", {
      email,
      redirect: true,
      callbackUrl: pathname || "/",
    });
  };

  if (status !== "authenticated" || !session?.user) return null;
  if (shouldHide) return null;

  const isImpersonating = !!(session as { originalUserId?: string | null }).originalUserId;
  const isAdmin = session.user.role === "admin";
  if (!isAdmin && !isImpersonating) return null;

  const availableTargets = users.filter((u) => u.id !== session.user.id);

  return (
    <footer className="border-t border-dashed border-rer-border bg-rer-app/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-[11px] text-rer-subtle">
        <span>
          {isImpersonating ? (
            <>
              Simulation (bêta) – vue actuelle :{" "}
              <span className="font-medium text-rer-muted">
                {session.user.email} · {session.user.role}
              </span>
            </>
          ) : (
            <>
              Vue simulée utilisateur (bêta) – connecté en tant que{" "}
              <span className="font-medium text-rer-muted">
                {session.user.email} · {session.user.role}
              </span>
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          {isImpersonating ? (
            <button
              type="button"
              onClick={handleRevert}
              className="rounded-lg border border-rer-border bg-white px-2 py-1 text-[11px] font-medium text-rer-blue hover:bg-rer-app/60"
            >
              Revenir à mon compte ({(session as { originalUserEmail?: string }).originalUserEmail})
            </button>
          ) : (
            <>
              <label className="hidden text-[11px] sm:inline">
                Simuler&nbsp;:
              </label>
              <select
                defaultValue=""
                onChange={(e) => handleSwitchUser(e.target.value)}
                className="rounded-lg border border-rer-border bg-white px-2 py-1 text-[11px] text-rer-muted hover:bg-rer-app/60"
              >
                <option value="">Choisir un utilisateur…</option>
                {availableTargets.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} · {user.role}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}

