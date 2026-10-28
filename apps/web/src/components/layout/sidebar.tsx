"use client";

import { NavItem } from "./nav-item";
import {
  Building2Icon,
  CloseIcon,
  EyeIcon,
  FolderKanbanIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "./icons";

export const SIDEBAR_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/search", label: "Busca Geral", icon: SearchIcon },
  { href: "/proponents", label: "Organizações / Proponentes", icon: Building2Icon },
  { href: "/projects", label: "Projetos", icon: FolderKanbanIcon },
  { href: "/observations", label: "Observações", icon: EyeIcon },
  { href: "/users", label: "Usuários", icon: UsersIcon },
  { href: "/sdgs", label: "SDGs", icon: GlobeIcon },
  { href: "/settings", label: "Configurações", icon: SettingsIcon },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function NavGroup() {
  return (
    <nav className="flex flex-col gap-1 md:gap-2">
      {SIDEBAR_NAV_ITEMS.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </nav>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay (aparece apenas quando o drawer está aberto no mobile) */}
      {open && (
        <button
          type="button"
          aria-label="Fechar menu de navegação"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          aria-expanded={open}
        />
      )}

      {/* Mobile drawer panel (desliza da esquerda no mobile) */}
      <aside
        aria-label="Navegação principal"
        className={`
          fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border
          bg-sidebar p-4 text-sidebar-foreground
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:hidden
        `}
      >
        <div className="flex items-center justify-between pb-6 pt-2 md:pb-0 md:pt-0 md:px-4">
          <span className="font-serif text-3xl font-bold tracking-tight md:text-sidebar-foreground">
            Arthemis
          </span>
          <button
            type="button"
            aria-label="Fechar menu de navegação"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-sidebar-accent md:hidden"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <NavGroup />
      </aside>

      {/* Desktop sidebar (sempre visível, fixa à esquerda) */}
      <aside
        aria-label="Navegação principal"
        className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-full flex-shrink-0"
      >
        <div className="flex items-center justify-between pb-6 pt-2 px-4">
          <span className="font-serif text-3xl font-bold tracking-tight">
            Arthemis
          </span>
        </div>

        <NavGroup />
      </aside>
    </>
  );
}