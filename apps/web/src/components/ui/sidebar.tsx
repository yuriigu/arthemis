"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

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