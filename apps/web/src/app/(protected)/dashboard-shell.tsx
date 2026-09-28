"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";
import type { AuthUser } from "@/lib/auth/constants";

export function DashboardShell({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh md:pl-64">
      <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-h-dvh flex-col">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function Header({
  user,
  onMenuClick,
}: {
  user: AuthUser;
  onMenuClick: () => void;
}) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    await logout();
  }

  return (
    <header className="flex min-h-20 items-center gap-4 border-b border-border bg-card px-4 md:px-8">
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={onMenuClick}
        className="rounded-lg p-2 hover:bg-accent focus-visible:outline-2 md:hidden"
      >
        <MenuIcon />
      </button>
      <div className="min-w-0 flex-1 text-right">
        <p className="mb-0 truncate font-semibold text-foreground">{user.name}</p>
        <p className="mb-0 truncate text-sm text-muted-foreground">
          {user.email} · {user.role}
        </p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingOut ? "Saindo..." : "Sair"}
      </button>
    </header>
  );
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}
      <aside
        aria-label="Navegação principal"
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between pb-6 pt-2">
          <span className="font-serif text-3xl font-bold tracking-tight">Arthemis</span>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-sidebar-accent md:hidden"
          >
            <CloseIcon />
          </button>
        </div>
        <nav>
          <Link
            href="/dashboard"
            aria-current={isDashboard ? "page" : undefined}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-md px-4 py-3 font-medium hover:bg-sidebar-accent ${isDashboard ? "bg-sidebar-primary text-sidebar-primary-foreground" : ""}`}
          >
            <DashboardIcon />
            Dashboard
          </Link>
        </nav>
      </aside>
    </>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
