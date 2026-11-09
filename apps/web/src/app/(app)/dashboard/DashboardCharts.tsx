"use client";

import { useMemo, useState } from "react";
import { LineChart, PieChart } from "@/components/ui/chart";
import { isProjectActiveAt, parseEndOfDayUtc } from "@/components/ui/chart/chart-utils";

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
    if (projects.length === 0) return [];

    const now = new Date(asOf);
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();

    const earliestStart = projects.reduce<number | null>((earliest, project) => {
      if (!project.lifetimeStart) return earliest;
      const start = Date.parse(project.lifetimeStart);
      return Number.isFinite(start) ? Math.min(earliest ?? start, start) : earliest;
    }, null);

    const historyMonths =
      earliestStart === null
        ? 12
        : Math.max(
            12,
            (currentYear - new Date(earliestStart).getUTCFullYear()) * 12 +
              currentMonth -
              new Date(earliestStart).getUTCMonth() +
              1,
          );

    const months = period === "1M" ? 1 : period === "1Y" ? 12 : historyMonths;

    return Array.from({ length: months }, (_, index) => {
      const monthOffset = currentMonth - months + index + 1;
      const monthStartUtc = Date.UTC(currentYear, monthOffset, 1, 0, 0, 0, 0);
      const monthEndUtc = Date.UTC(currentYear, monthOffset + 1, 0, 23, 59, 59, 999);
      const date = new Date(monthStartUtc);
      const targetYear = date.getUTCFullYear();
      const targetMonth = date.getUTCMonth();

      const starts = projects.filter((project) => {
        if (!project.lifetimeStart) return false;
        const parsed = Date.parse(project.lifetimeStart);
        if (!Number.isFinite(parsed)) return false;
        const start = new Date(parsed);
        return (
          start.getUTCFullYear() === targetYear &&
          start.getUTCMonth() === targetMonth
        );
      }).length;

      const active = projects.filter((project) => {
        const start = project.lifetimeStart
          ? Date.parse(project.lifetimeStart)
          : Number.NEGATIVE_INFINITY;
        const end = parseEndOfDayUtc(project.lifetimeEnd);
        const validStart = Number.isFinite(start) ? start : Number.NEGATIVE_INFINITY;
        return validStart <= monthEndUtc && end >= monthStartUtc;
      }).length;

      return { date, novos: starts, ativos: active };
    });
  }, [asOf, period, projects]);

  const active = projects.filter((project) => isProjectActiveAt(project, asOf)).length;
  const completed = Math.max(0, projects.length - active);

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
        description="Proporção atual entre projetos em vigência e encerrados."
        slices={[
          { label: "Vigentes", value: active, color: "#2563eb" },
          { label: "Encerrados", value: completed, color: "#a855f7" },
        ]}
        emptySliceNote={
          projects.length > 0 && completed === 0
            ? "Nenhum projeto encerrado até o momento — todos os projetos cadastrados estão vigentes."
            : undefined
        }
      />
    </div>
  );
}

