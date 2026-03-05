"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const enableUserSwitch =
  process.env.NEXT_PUBLIC_ENABLE_USER_SWITCH === "1";

type UserSummary = {
  id: string;
  email: string;
  role: string;
};

export function AppUserStatus() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // On évite d'afficher le bloc sur la page login elle-même.
  if (pathname === "/login") return null;

  useEffect(() => {
    if (!enableUserSwitch) return;
    if (!session?.user) return;
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
  }, [loadingUsers, session?.user, users.length]);

  const handleSwitchUser = async (userId: string) => {
    if (!userId) return;
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    await signIn("impersonate", {
      email: target.email,
      redirect: true,
      callbackUrl: "/",
    });
  };

  if (status === "loading") {
    return (
      <div className="text-[11px] text-rer-subtle">
        Vérification de la session…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="text-xs font-medium text-rer-blue hover:text-rer-text"
      >
        Se connecter
      </Link>
    );
  }

  const canSwitchUsers =
    enableUserSwitch && users.length > 0;

  const availableTargets = users.filter(
    (u) => u.id !== session.user.id
  );

  return (
    <div className="flex items-center gap-2 text-xs text-rer-muted">
      <span className="hidden sm:inline">
        {session.user.email} · rôle {session.user.role}
      </span>

      {canSwitchUsers && availableTargets.length > 0 && (
        <select
          defaultValue=""
          onChange={(event) => handleSwitchUser(event.target.value)}
          className="hidden lg:inline-block rounded-full border border-rer-border bg-white px-2 py-0.5 text-[11px] text-rer-muted hover:bg-rer-app/60"
        >
          <option value="">
            Changer d&apos;utilisateur (bêta)
          </option>
          {availableTargets.map((user) => (
            <option key={user.id} value={user.id}>
              {user.email} · {user.role}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border border-rer-border bg-white px-2 py-0.5 text-[11px] font-medium text-rer-muted hover:bg-rer-app/60"
      >
        Se déconnecter
      </button>
    </div>
  );
}

