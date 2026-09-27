import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Painel de monitoramento ambiental do Arthemis",
};

export default function DashboardPage() {
  return (
    <section>
      <p className="text-sm font-medium text-sage-green-700">Visão geral</p>
      <h1>Dashboard</h1>
    </section>
  );
}
