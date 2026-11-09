"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Building2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Users,
} from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  title: string;
  url: string;
  icon?: ReactNode;
}

export interface SidebarProps {
  groupLabel?: string;
  items?: SidebarItem[];
}

const defaultItems: SidebarItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboard aria-hidden="true" /> },
  { title: "Busca Geral", url: "/search", icon: <Search aria-hidden="true" /> },
  { title: "Organizações", url: "/organizations", icon: <Building2 aria-hidden="true" /> },
  { title: "Projetos", url: "/projects", icon: <FolderKanban aria-hidden="true" /> },
  { title: "Observações", url: "/observations", icon: <MapPin aria-hidden="true" /> },
  { title: "Usuários", url: "/users", icon: <Users aria-hidden="true" /> },
];

export function AppSidebar({ groupLabel = "Arthemis", items = defaultItems }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn("flex min-h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200", collapsed ? "w-16" : "w-64")}>
      <header className="relative flex min-h-16 items-center justify-center gap-2 px-3">
        {!collapsed && <span className="truncate text-center font-serif text-xl font-bold tracking-tight">{groupLabel}</span>}
        <button type="button" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)} className="absolute right-3 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
        </button>
      </header>
      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 px-2 py-3">
        {items.map((item) => {
          const active = pathname === item.url || (item.url !== "/" && pathname.startsWith(`${item.url}/`));
          return (
            <Link key={item.title} href={item.url} title={collapsed ? item.title : undefined} aria-current={active ? "page" : undefined} className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
        <form action={logoutAction}>
          <button
            type="submit"
            title={collapsed ? "Sair" : undefined}
            className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut aria-hidden="true" className="size-5 shrink-0" />
            {!collapsed && <span className="truncate">Sair</span>}
          </button>
        </form>
      </nav>
    </aside>
  );
}
