"use client";

import { useState } from "react";
import Link from "next/link";

interface Location {
  id: string;
  ecosystem?: string | null;
  country?: string | null;
  extent?: number | null;
}

interface Indicator {
  id: string;
  name: string;
  unit?: string | null;
  valueBaseline?: number | null;
  valueReference?: number | null;
  observationMethod?: string | null;
  justification?: string | null;
}

interface Observation {
  id: string;
  indicatorId: string;
  value: number;
  date: string;
  indicator?: { name: string; unit: string | null };
}

interface Project {
  id: string;
  name: string;
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
  justification?: string | null;
  locations: Location[];
  activities: Array<{
    id: string;
    name: string;
    description?: string | null;
    justification?: string | null;
    indicators: Indicator[];
    activityLocations: Array<{ location: Location }>;
  }>;
  projectSdgs: Array<{ sdg: { id: string; number: number; name: string; iconUrl?: string | null } }>;
}

type Tab = "activities" | "locations" | "indicators" | "observations";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "activities", label: "Atividades" },
  { id: "locations", label: "Localizações" },
  { id: "indicators", label: "Indicadores" },
  { id: "observations", label: "Observações" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function IndicatorList({ indicators }: { indicators: Indicator[] }) {
  if (!indicators.length) return <p className="text-sm text-muted-foreground">Nenhum indicador vinculado.</p>;
  return <ul className="divide-y divide-border">
    {indicators.map((indicator) => <li key={indicator.id} className="space-y-1 py-3">
      <strong>{indicator.name}</strong>
      <p className="text-sm text-muted-foreground">
        Unidade: {indicator.unit || "—"} · Baseline: {indicator.valueBaseline ?? "—"} · Referência: {indicator.valueReference ?? "—"}
      </p>
      {indicator.observationMethod && <p className="text-sm text-muted-foreground">Método: {indicator.observationMethod}</p>}
    </li>)}
  </ul>;
}

export function ProjectDetails({
  project,
  observations,
}: {
  project: Project;
  observations: Observation[];
}) {
  const [selected, setSelected] = useState<Tab>("activities");
  const indicators = project.activities.flatMap((activity) => activity.indicators ?? []);
  const indicatorIds = new Set(indicators.map((indicator) => indicator.id));
  const projectObservations = observations.filter((item) => indicatorIds.has(item.indicatorId));
  const totalArea = project.locations.reduce((sum, location) => sum + Number(location.extent ?? 0), 0);
  const locationSummary = Array.from(new Set(
    project.locations.map((location) => [location.country, location.ecosystem].filter(Boolean).join(" · ")).filter(Boolean),
  ));

  return (
    <article className="w-full space-y-6">
      <Link href="/projects" className="text-sm font-medium text-primary hover:underline">← Voltar aos projetos</Link>
      <header className="space-y-4 rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p><strong className="text-foreground">Vigência:</strong> {formatDate(project.lifetimeStart)} até {formatDate(project.lifetimeEnd)}</p>
          <p><strong className="text-foreground">Área total:</strong> {totalArea.toLocaleString("pt-BR")} ha</p>
          <p className="sm:col-span-2"><strong className="text-foreground">Localização:</strong> {locationSummary.join("; ") || "Não informada"}</p>
        </div>
        {project.justification && <p className="text-sm text-muted-foreground"><strong className="text-foreground">Justificativa:</strong> {project.justification}</p>}
        {!!project.projectSdgs.length && <div className="flex flex-wrap gap-2" aria-label="Objetivos de Desenvolvimento Sustentável">
          {project.projectSdgs.map(({ sdg }) => <span key={sdg.id} title={sdg.name} className="rounded-md bg-muted px-3 py-2 text-xs font-medium">ODS {sdg.number}: {sdg.name}</span>)}
        </div>}
      </header>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Detalhes do projeto</h2>
        <div role="tablist" aria-label="Detalhes do projeto" className="flex flex-wrap gap-2 border-b border-border pb-3">
          {tabs.map((tab) => <button
            type="button"
            role="tab"
            key={tab.id}
            aria-selected={selected === tab.id}
            onClick={() => setSelected(tab.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium ${selected === tab.id ? "bg-primary text-white" : "bg-muted text-foreground/80 hover:bg-accent"}`}
          >{tab.label}</button>)}
        </div>

        {selected === "activities" && <div role="tabpanel" className="space-y-4">
          {project.activities.length ? project.activities.map((activity) => <article key={activity.id} className="rounded-md border border-border p-4">
            <h3 className="font-semibold">{activity.name}</h3>
            {activity.description && <p className="mt-2 text-sm text-muted-foreground">{activity.description}</p>}
            {activity.justification && <p className="mt-2 text-sm text-muted-foreground"><strong>Justificativa:</strong> {activity.justification}</p>}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div><h4 className="mb-2 text-sm font-medium">Localizações</h4>
                {activity.activityLocations.length ? <ul className="list-inside list-disc text-sm text-muted-foreground">{activity.activityLocations.map(({ location }) => <li key={location.id}>{location.country || "—"} · {location.ecosystem || "—"} · {location.extent ?? 0} ha</li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma localização vinculada.</p>}
              </div>
              <div><h4 className="mb-2 text-sm font-medium">Indicadores</h4><IndicatorList indicators={activity.indicators ?? []} /></div>
            </div>
          </article>) : <p className="text-sm text-muted-foreground">Nenhuma atividade cadastrada.</p>}
        </div>}

        {selected === "locations" && <div role="tabpanel" className="overflow-x-auto">
          {project.locations.length ? <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground"><tr><th className="py-2 pr-4">País</th><th className="py-2 pr-4">Ecossistema</th><th className="py-2">Área</th></tr></thead>
            <tbody>{project.locations.map((location) => <tr key={location.id} className="border-t border-border/50">
              <td className="py-3 pr-4">{location.country || "—"}</td><td className="py-3 pr-4">{location.ecosystem || "—"}</td><td className="py-3">{location.extent ?? "—"} ha</td>
            </tr>)}</tbody>
          </table> : <p className="text-sm text-muted-foreground">Nenhuma localização cadastrada.</p>}
        </div>}

        {selected === "indicators" && <div role="tabpanel"><IndicatorList indicators={indicators} /></div>}

        {selected === "observations" && <div role="tabpanel">
          {projectObservations.length ? (
            <ul className="divide-y divide-border">
              {projectObservations.map((observation) => <li key={observation.id} className="py-3">
                <strong>{observation.indicator?.name ?? "Indicador"}</strong>
                <p className="text-sm text-muted-foreground">
                  {observation.value}{observation.indicator?.unit ? ` ${observation.indicator.unit}` : ""}
                  {" · "}
                  {formatDate(observation.date)}
                </p>
              </li>)}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nenhuma observação cadastrada para os indicadores deste projeto.</p>}
        </div>}
      </section>
    </article>
  );
}
