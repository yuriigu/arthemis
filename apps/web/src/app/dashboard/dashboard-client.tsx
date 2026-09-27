"use client";

import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import type { AuthUser } from "@/lib/auth/constants";

export function DashboardClient({ user }: { user: AuthUser }) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sage-green-700">Arthemis</p>
          <h1 className="mt-1 text-3xl">Dashboard</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "Saindo..." : "Sair"}
        </button>
      </header>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Sessão ativa</p>
        <h2 className="mt-2 text-xl font-semibold">Olá, {user.name}!</h2>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="mt-1 font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Papel</dt>
            <dd className="mt-1 font-medium">{user.role}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">ID</dt>
            <dd className="mt-1 truncate font-mono text-xs">{user.id}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
