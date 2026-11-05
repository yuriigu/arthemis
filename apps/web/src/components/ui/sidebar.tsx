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
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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
      <header className="flex min-h-16 items-center justify-between gap-2 px-3">
        {!collapsed && <span className="truncate font-serif text-xl font-bold tracking-tight">{groupLabel}</span>}
        <div className="flex items-center gap-1">
          {!collapsed && <ThemeToggle />}
          <button type="button" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)} className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        </div>
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

export function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <aside className={cn("flex h-full flex-col", className)} {...props} />;
}
export function SidebarHeader(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} />; }
export function SidebarContent(props: React.HTMLAttributes<HTMLDivElement>) { return <div className="flex-1 overflow-auto" {...props} />; }
export function SidebarFooter(props: React.HTMLAttributes<HTMLDivElement>) { return <div className="mt-auto" {...props} />; }
export function SidebarGroup(props: React.HTMLAttributes<HTMLDivElement>) { return <section className="p-2" {...props} />; }
export function SidebarGroupLabel(props: React.HTMLAttributes<HTMLDivElement>) { return <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground" {...props} />; }
export function SidebarGroupAction(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button type="button" {...props} />; }
export function SidebarGroupContent(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} />; }
export function SidebarMenu(props: React.HTMLAttributes<HTMLUListElement>) { return <ul className="flex flex-col gap-1" {...props} />; }
export function SidebarMenuItem(props: React.LiHTMLAttributes<HTMLLIElement>) { return <li {...props} />; }
export function SidebarMenuButton(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) { return <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent" {...props} />; }
export function SidebarMenuAction(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button type="button" {...props} />; }
export function SidebarMenuBadge(props: React.HTMLAttributes<HTMLSpanElement>) { return <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs" {...props} />; }
export function SidebarMenuSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("h-9 animate-pulse rounded bg-muted", className)} {...props} />; }
export function SidebarMenuSub(props: React.HTMLAttributes<HTMLUListElement>) { return <ul className="ml-4 border-l border-border pl-2" {...props} />; }
export function SidebarMenuSubItem(props: React.LiHTMLAttributes<HTMLLIElement>) { return <li {...props} />; }
export function SidebarMenuSubButton(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) { return <a className="block rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent" {...props} />; }
export function SidebarInput(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input className="w-full rounded-md border border-input px-3 py-2 text-sm" {...props} />; }
export function SidebarInset(props: React.HTMLAttributes<HTMLElement>) { return <main className="min-w-0 flex-1" {...props} />; }
export function SidebarRail() { return null; }
export function SidebarSeparator() { return <hr className="my-2 border-border" />; }
export function SidebarTrigger({ onClick }: { onClick?: () => void }) { return <button type="button" aria-label="Alternar menu" onClick={onClick} className="rounded-md p-2 hover:bg-accent"><Menu aria-hidden="true" /></button>; }