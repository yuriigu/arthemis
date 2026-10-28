"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

export interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
}

export function NavItem({ href, label, icon: Icon }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`
        flex items-center gap-3 rounded-md px-4 py-3 font-medium
        transition-colors duration-200
        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
        ${isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground"}
      `}
    >
      <Icon className="size-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}