import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "./dashboard-shell";
import { getAuthToken, getCurrentUser } from "@/lib/auth/server";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/logout");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
