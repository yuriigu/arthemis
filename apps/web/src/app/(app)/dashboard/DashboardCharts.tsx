"use client";

import { useMemo, useState } from "react";
import { LineChart, PieChart } from "@/components/ui/chart";

interface Project {
  id: string;
  name: string;
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
}

const periods = ["1M", "1Y", "All"] as const;
type Period = (typeof periods)[number];

export function DashboardCharts({ projects, asOf }: { projects: Project[]; asOf: number }) {
  const [period, setPeriod] = useState<Period>("1Y");
  const chartData = useMemo(() => {
    const now = new Date(asOf);
    const earliestStart = projects.reduce<number | null>((earliest, project) => {
      if (!project.lifetimeStart) return earliest;
      const start = Date.parse(project.lifetimeStart);
      return Number.isFinite(start) ? Math.min(earliest ?? start, start) : earliest;
    }, null);
    const historyMonths = earliestStart === null
      ? 12
      : Math.max(1, (now.getFullYear() - new Date(earliestStart).getFullYear()) * 12 + now.getMonth() - new Date(earliestStart).getMonth() + 1);
    const months = period === "1M" ? 1 : period === "1Y" ? 12 : historyMonths;
    return Array.from({ length: months }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - months + index + 1, 1);
      const starts = projects.filter((project) => {
        if (!project.lifetimeStart) return false;
        const start = new Date(project.lifetimeStart);
        return start.getFullYear() === date.getFullYear() && start.getMonth() === date.getMonth();
      }).length;
      const active = projects.filter((project) => {
        const start = project.lifetimeStart ? Date.parse(project.lifetimeStart) : Number.NEGATIVE_INFINITY;
        const end = project.lifetimeEnd ? Date.parse(project.lifetimeEnd) : Number.POSITIVE_INFINITY;
        return start <= date.getTime() && end >= date.getTime();
      }).length;
      return { date, novos: starts, ativos: active };
    });
  }, [asOf, period, projects]);
  const active = projects.filter((project) => {
    const start = project.lifetimeStart ? Date.parse(project.lifetimeStart) : Number.NEGATIVE_INFINITY;
    const end = project.lifetimeEnd ? Date.parse(project.lifetimeEnd) : Number.POSITIVE_INFINITY;
    return start <= asOf && end >= asOf;
  }).length;
  const completed = projects.length - active;

  return (
    <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
      <LineChart
        title="Projetos ao longo do tempo"
        description="Projetos iniciados e vigentes em cada mês."
        data={chartData}
        series={[
          { key: "novos", label: "Iniciados", color: "#2563eb" },
          { key: "ativos", label: "Vigentes", color: "#a855f7" },
        ]}
        selectedPeriod={period}
        periodOptions={periods}
        onPeriodChange={(value) => {
          if (periods.includes(value as Period)) setPeriod(value as Period);
        }}
      />
      <PieChart
        title="Situação dos projetos"
        slices={[
          { label: "Vigentes", value: active, color: "#2563eb" },
          { label: "Encerrados", value: completed, color: "#a855f7" },
        ]}
      />
    </div>
  );
}
