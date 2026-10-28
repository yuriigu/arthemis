"use client";

import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import type { AuthUser } from "@/lib/auth/constants";
import { LogOutIcon, MenuIcon } from "@/components/layout/icons";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  user: AuthUser;
  onMenuClick: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // logout já trata redirecionamento internamente;
      // erros inesperados são capturados pelo toaster global do root layout
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="flex min-h-20 items-center gap-4 border-b border-border bg-card px-4 md:px-8">
      <button
        type="button"
        aria-label="Abrir menu de navegação"
        onClick={onMenuClick}
        className="rounded-lg p-2 hover:bg-accent focus-visible:outline-2 md:hidden"
      >
        <MenuIcon className="size-5" />
      </button>

      <UserMenu user={user} />

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          {isLoggingOut ? "Saindo..." : "Sair"}
          <LogOutIcon className="ml-2 size-4" />
        </button>
      </div>
    </header>
  );
}