import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthToken, getCurrentUser } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/logout");

  return <DashboardShell>{children}</DashboardShell>;
}
