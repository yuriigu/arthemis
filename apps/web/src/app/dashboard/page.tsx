import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardClient } from "./dashboard-client";
import { getAuthToken, getCurrentUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Painel de monitoramento ambiental do Arthemis",
};

export default async function DashboardPage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const user = await getCurrentUser();
  // O middleware não valida a assinatura. Se o backend rejeitar o JWT, a rota
  // de logout também o remove antes de devolver o usuário ao login.
  if (!user) redirect("/api/auth/logout");

  return <DashboardClient user={user} />;
}
