import { Suspense } from "react";
import { connection } from "next/server";
import { MetricCard } from "@/components/ui/chart";
import {
  getCurrentTimestamp,
  listIndicators,
  listOrganizations,
  listProjects,
  requireAuthToken,
} from "@/lib/api/server";
import { DashboardCharts } from "./dashboard/DashboardCharts";

async function DashboardContent() {
  const token = await requireAuthToken();
  await connection();
  const [projects, organizations, indicators] = await Promise.all([
    listProjects(token),
    listOrganizations(token),
    listIndicators(token),
  ]);
  const now = getCurrentTimestamp();
  const activeProjects = projects.filter((project) => {
    const start = project.lifetimeStart ? Date.parse(project.lifetimeStart) : Number.NEGATIVE_INFINITY;
    const end = project.lifetimeEnd ? Date.parse(project.lifetimeEnd) : Number.POSITIVE_INFINITY;
    return start <= now && end >= now;
  });

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral dos dados cadastrados na plataforma.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Projetos" value={projects.length} />
        <MetricCard title="Projetos ativos" value={activeProjects.length} />
        <MetricCard title="Organizações" value={organizations.length} />
        <MetricCard title="Indicadores" value={indicators.length} />
      </div>
      <DashboardCharts projects={projects} asOf={now} />
    </section>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <section className="space-y-8" aria-busy="true" aria-label="Carregando painel">
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <div className="h-80 animate-pulse rounded-lg bg-muted" />
            <div className="h-80 animate-pulse rounded-lg bg-muted" />
          </div>
        </section>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
