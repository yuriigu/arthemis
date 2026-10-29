"use client";

import { useState, type ReactNode } from "react";

import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function DashboardShell({
  children,
}: {
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
        <main className="flex-1 overflow-y-auto pt-6 md:p-8">{children}</main>

        {/* Theme toggle flutuante no canto superior direito */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}