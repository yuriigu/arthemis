"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const SidebarStateContext = createContext<{ open: boolean; toggle: () => void } | null>(null);

export function SidebarProvider({ children, defaultOpen = true }: { children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return <SidebarStateContext.Provider value={{ open, toggle: () => setOpen((value) => !value) }}>{children}</SidebarStateContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarStateContext);
  if (!context) throw new Error("useSidebar must be used inside SidebarProvider.");
  return context;
}
