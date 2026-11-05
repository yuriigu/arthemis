import type { SidebarItem } from "@/components/ui/sidebar";
import { createElement } from "react";
import {
  Building2,
  FolderKanban,
  LayoutDashboard,
  MapPin,
  Search,
  Users,
} from "lucide-react";

export const defaultSidebarItems: SidebarItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: createElement(LayoutDashboard, { "aria-hidden": true }) },
  { title: "Busca Geral", url: "/search", icon: createElement(Search, { "aria-hidden": true }) },
  { title: "Organizações", url: "/organizations", icon: createElement(Building2, { "aria-hidden": true }) },
  { title: "Projetos", url: "/projects", icon: createElement(FolderKanban, { "aria-hidden": true }) },
  { title: "Observações", url: "/observations", icon: createElement(MapPin, { "aria-hidden": true }) },
  { title: "Usuários", url: "/users", icon: createElement(Users, { "aria-hidden": true }) },
];
