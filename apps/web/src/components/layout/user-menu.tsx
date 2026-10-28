"use client";

import type { AuthUser } from "@/lib/auth/constants";

export interface UserMenuProps {
  user: AuthUser;
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="min-w-0 flex-1 text-right">
      <p className="mb-0 truncate font-semibold text-foreground">
        {user.name}
      </p>
      <p className="mb-0 truncate text-sm text-muted-foreground">
        {user.email} · {user.role}
      </p>
    </div>
  );
}