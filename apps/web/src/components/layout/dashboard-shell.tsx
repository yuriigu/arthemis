"use client";

import { useState, type ReactNode } from "react";

import type { AuthUser } from "@/lib/auth/constants";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function DashboardShell({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar fixa à esquerda (desktop) + drawer mobile */}
      <Sidebar
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Área principal de conteúdo */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}