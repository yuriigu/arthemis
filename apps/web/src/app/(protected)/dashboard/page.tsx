import type { Metadata } from "next";

import { HealthStatus } from "./health-status";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Painel de monitoramento ambiental do Arthemis",
};

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-sage-green-700">Visão geral</p>
        <h1>Dashboard</h1>
      </div>
      <HealthStatus />
    </section>
  );
}