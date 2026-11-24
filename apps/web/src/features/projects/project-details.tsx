"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LineChart, type LineChartDataPoint } from "@/components/ui/chart";
import { Select } from "@/components/ui/select";
import {
  ObservationMap,
  type MapLocation,
  type MapObservation,
} from "@/features/observations/observation-map";
import { SdgIcon } from "./sdg-icon";
import type { MonitoringPeriod } from "@/lib/types";
import { createPeriodAction, verifyPeriodAction } from "@/features/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { transitionProjectAction } from "@/features/projects/actions";
import { NEXT_STATUS, PROJECT_STATUS_LABEL } from "@/lib/types";
import { COMPONENT_LABEL, DIRECTION_LABEL } from "@/lib/types";

interface Location {
  id: string;
  ecosystem?: string | null;
  country?: string | null;
  extent?: number | null;
  position?: unknown;
  ecosystemCode?: string | null;
}

interface Indicator {
  id: string;
  activityId: string;
  name: string;
  unit?: string | null;
  valueBaseline?: number | null;
  valueReference?: number | null;
  observationMethod?: string | null;
  justification?: string | null;
  component?: "composition" | "structure" | null;
  direction?: "increases_with_condition" | "decreases_with_condition" | null; 
}

interface Observation {
  id: string;
  indicatorId: string;
  value: number;
  date: string;
  position?: unknown | null;
  indicator?: { name: string; unit: string | null };
}

interface Activity {
  id: string;
  name: string;
  description?: string | null;
  justification?: string | null;
  indicators: Indicator[];
  activityLocations: Array<{ location: Location }>;
}

interface Project {
  id: string;
  name: string;
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
  justification?: string | null;
  locations: Location[];
  activities: Activity[];
  projectSdgs: Array<{
    sdg: { id: string; number: number; name: string; iconUrl?: string | null };
  }>;
  status?: "draft" | "listed" | "under_validation" | "validated" | "under_verification" | "verified" | "expired" | null;
}

type Tab = "activities" | "locations" | "indicators" | "observations";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "activities", label: "Atividades" },
  { id: "locations", label: "Localizações" },
  { id: "indicators", label: "Indicadores" },
  { id: "observations", label: "Observações" },
];

const indicatorPalette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--color-sage-green-700)",
  "var(--primary)",
  "var(--destructive)",
  "var(--foreground)",
] as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getPointCoordinates(position: unknown): [number, number] | null {
  const geometry =
    isRecord(position) && position.type === "Feature"
      ? position.geometry
      : position;
  if (
    !isRecord(geometry) ||
    geometry.type !== "Point" ||
    !Array.isArray(geometry.coordinates)
  ) {
    return null;
  }

  const [longitude, latitude] = geometry.coordinates;
  if (
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  return [longitude, latitude];
}

function IndicatorList({
  indicators,
  activityNames,
}: {
  indicators: Indicator[];
  activityNames: Map<string, string>;
}) {
  if (!indicators.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum indicador vinculado.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {indicators.map((indicator) => {
        const componentLabel = indicator.component
          ? COMPONENT_LABEL[indicator.component] ?? indicator.component
          : "—";
        const directionLabel = indicator.direction
          ? DIRECTION_LABEL[indicator.direction] ?? indicator.direction
          : "—";

        return (
          <li key={indicator.id} className="space-y-1 py-3">
            <strong>{indicator.name}</strong>
            <p className="text-sm text-muted-foreground">
              Atividade: {activityNames.get(indicator.id) ?? "—"} · Unidade:{" "}
              {indicator.unit || "—"} · Baseline: {indicator.valueBaseline ?? "—"}{" "}
              · Referência: {indicator.valueReference ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Componente: {componentLabel} · Direção: {directionLabel}
            </p>
            {indicator.observationMethod && (
              <p className="text-sm text-muted-foreground">
                Método: {indicator.observationMethod}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ProjectDetails({
  project,
  observations,
  role,
  error,
  periods,
}: {
  project: Project;
  observations: Observation[];
  role: "admin" | "manager" | "visitor";
  error?: string;
  periods: MonitoringPeriod[];
}) {
  const [selected, setSelected] = useState<Tab>("activities");
  const [selectedActivityId, setSelectedActivityId] = useState(
    project.activities[0]?.id ?? "",
  );
  const indicators = project.activities.flatMap(
    (activity) => activity.indicators ?? [],
  );
  const activityNames = new Map(
    project.activities.flatMap((activity) =>
      (activity.indicators ?? []).map(
        (indicator) => [indicator.id, activity.name] as const,
      ),
    ),
  );
  const colorsByIndicator = new Map(
    indicators.map(
      (indicator, index) =>
        [
          indicator.id,
          indicatorPalette[index % indicatorPalette.length],
        ] as const,
    ),
  );
  const observationsByIndicator = useMemo(() => {
    const grouped = new Map<string, Observation[]>();
    for (const observation of observations) {
      const group = grouped.get(observation.indicatorId) ?? [];
      group.push(observation);
      grouped.set(observation.indicatorId, group);
    }
    return grouped;
  }, [observations]);

  const selectedActivity =
    project.activities.find((activity) => activity.id === selectedActivityId) ??
    null;
  const selectedActivityIndicators = selectedActivity?.indicators ?? [];
  const selectedActivityObservations = selectedActivityIndicators.flatMap(
    (indicator) => observationsByIndicator.get(indicator.id) ?? [],
  );
  const chartData = (() => {
    const dailyValues = new Map<
      string,
      Map<string, { sum: number; count: number }>
    >();

    for (const indicator of selectedActivityIndicators) {
      for (const observation of observationsByIndicator.get(indicator.id) ??
        []) {
        const timestamp = Date.parse(observation.date);
        if (!Number.isFinite(timestamp)) continue;
        const date = new Date(timestamp).toISOString().slice(0, 10);
        const values = dailyValues.get(date) ?? new Map();
        const current = values.get(indicator.id) ?? { sum: 0, count: 0 };
        values.set(indicator.id, {
          sum: current.sum + observation.value,
          count: current.count + 1,
        });
        dailyValues.set(date, values);
      }
    }

    return Array.from(dailyValues.entries())
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([date, values]) => {
        const point: LineChartDataPoint = {
          date: new Date(`${date}T00:00:00.000Z`),
        };
        for (const indicator of selectedActivityIndicators) {
          const value = values.get(indicator.id);
          point[indicator.id] = value ? value.sum / value.count : null;
        }
        return point;
      });
  })();
  const chartSeries = selectedActivityIndicators.map((indicator) => ({
    key: indicator.id,
    label: indicator.name,
    color: colorsByIndicator.get(indicator.id) ?? "var(--primary)",
  }));
  const mapLocations: MapLocation[] =
    selectedActivity?.activityLocations.map(({ location }) => location) ?? [];
  const indicatorById = new Map(
    selectedActivityIndicators.map((indicator) => [indicator.id, indicator]),
  );
  const mapObservations: MapObservation[] =
    selectedActivityObservations.flatMap((observation) => {
      const coordinates = getPointCoordinates(observation.position);
      if (!coordinates) return [];
      const indicator = indicatorById.get(observation.indicatorId);
      return [
        {
          id: observation.id,
          name: indicator?.name ?? observation.indicator?.name ?? "Indicador",
          unit: indicator?.unit ?? observation.indicator?.unit ?? "",
          value: observation.value,
          date: observation.date,
          lng: coordinates[0],
          lat: coordinates[1],
          color:
            colorsByIndicator.get(observation.indicatorId) ?? "var(--primary)",
        },
      ];
    });
  const totalArea = project.locations.reduce(
    (sum, location) => sum + Number(location.extent ?? 0),
    0,
  );
  const locationSummary = Array.from(
    new Set(
      project.locations
        .map((location) => {
          const ecosystemDisplay =
            location.ecosystem && location.ecosystemCode
              ? `${location.ecosystem} (${location.ecosystemCode})`
              : (location.ecosystem || location.ecosystemCode);
          return [location.country, ecosystemDisplay].filter(Boolean).join(" · ");
        })
        .filter(Boolean),
    ),
  );

  const status = project.status ?? "draft";
  const next = NEXT_STATUS[status];
  const adminOnly = next === "validated" || next === "verified";
  const canTransition = next !== null && (!adminOnly || role === "admin");

  return (
    <article className="w-full space-y-6">
      <Link
        href="/projects"
        className="text-sm font-medium text-primary hover:underline"
      >
        ← Voltar aos projetos
      </Link>
      <header className="space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <Badge variant="secondary">{PROJECT_STATUS_LABEL[status]}</Badge>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            <strong className="text-foreground">Vigência:</strong>{" "}
            {formatDate(project.lifetimeStart)} até{" "}
            {formatDate(project.lifetimeEnd)}
          </p>
          <p>
            <strong className="text-foreground">Área total:</strong>{" "}
            {totalArea.toLocaleString("pt-BR")} ha
          </p>
          <p className="sm:col-span-2">
            <strong className="text-foreground">Localização:</strong>{" "}
            {locationSummary.join("; ") || "Não informada"}
          </p>
        </div>
        {project.justification && (
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Justificativa:</strong>{" "}
            {project.justification}
          </p>
        )}
        {!!project.projectSdgs.length && (
          <div
            className="flex flex-wrap gap-2"
            aria-label="Objetivos de Desenvolvimento Sustentável"
          >
            {project.projectSdgs.map(({ sdg }) => {
              return (
                <SdgIcon
                  key={sdg.id}
                  iconUrl={sdg.iconUrl}
                  number={sdg.number}
                  name={sdg.name}
                  className="size-14 shrink-0"
                />
              );
            })}
          </div>
        )}
      </header>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {canTransition && next ? (
    <form action={transitionProjectAction}>
      <input type="hidden" name="id" value={project.id} />
      <input type="hidden" name="to" value={next} />
      <Button type="submit">
       {next === "validated"
          ? "Validar"
          : next === "verified"
          ? "Verificar"
          : `Mover para ${PROJECT_STATUS_LABEL[next]}`}
      </Button>
    </form>
        ) : null}

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Monitoramento de Atividade
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe os indicadores, observações e localizações da atividade
              selecionada.
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <label
              htmlFor="monitoring-activity"
              className="mb-1 block text-sm font-medium"
            >
              Atividade
            </label>
            <Select
              id="monitoring-activity"
              aria-label="Selecionar atividade para monitoramento"
              value={selectedActivityId}
              onChange={(event) => setSelectedActivityId(event.target.value)}
              disabled={!project.activities.length}
            >
              <option value="">Selecione uma atividade</option>
              {project.activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {selectedActivity ? (
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <LineChart
              title="Indicadores ao longo do tempo"
              description="Valores das observações registradas em cada data."
              data={chartData}
              series={chartSeries}
              dotted
              dateFormat="day"
              className="min-w-0"
            />
            <section className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4">
              <div>
                <h3 className="font-semibold">Localizações e observações</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedActivity.name}
                </p>
              </div>
              <ObservationMap
                locations={mapLocations}
                observations={mapObservations}
              />
            </section>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma atividade cadastrada para monitoramento.
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Detalhes do projeto</h2>
        <div
          role="tablist"
          aria-label="Detalhes do projeto"
          className="flex flex-wrap gap-2 border-b border-border pb-3"
        >
          {tabs.map((tab) => (
            <button
              type="button"
              role="tab"
              key={tab.id}
              aria-selected={selected === tab.id}
              onClick={() => setSelected(tab.id)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                selected === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground/80 hover:bg-accent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-auto overscroll-contain pr-1">
          {selected === "activities" && (
            <div role="tabpanel" className="space-y-4">
              {project.activities.length ? (
                project.activities.map((activity) => (
                  <article
                    key={activity.id}
                    className="rounded-md border border-border p-4"
                  >
                    <h3 className="font-semibold">{activity.name}</h3>
                    {activity.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                    {activity.justification && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <strong className="text-foreground">
                          Justificativa:
                        </strong>{" "}
                        {activity.justification}
                      </p>
                    )}
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-medium">
                          Localizações
                        </h4>
                        {activity.activityLocations.length ? (
                          <ul className="list-inside list-disc text-sm text-muted-foreground">
                            {activity.activityLocations.map(({ location }) => (
                              <li key={location.id}>
                                {location.country || "—"} ·{" "}
                                {location.ecosystem || "—"}
                                {location.ecosystemCode
                                  ? ` (${location.ecosystemCode})`
                                  : ""}{" "}
                                · {location.extent ?? "—"} ha
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Nenhuma localização vinculada.
                          </p>
                        )}
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-medium">
                          Indicadores
                        </h4>
                        <IndicatorList
                          indicators={activity.indicators ?? []}
                          activityNames={activityNames}
                        />
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade cadastrada.
                </p>
              )}
            </div>
          )}

          {selected === "locations" && (
            <div role="tabpanel" className="overflow-x-auto">
              {project.locations.length ? (
                <table className="w-full text-left text-sm">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4">País</th>
                      <th className="py-2 pr-4">Ecossistema</th>
                      <th className="py-2 pr-4">Código IUCN</th>
                      <th className="py-2">Área</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.locations.map((location) => (
                      <tr
                        key={location.id}
                        className="border-t border-border/50"
                      >
                        <td className="py-3 pr-4">{location.country || "—"}</td>
                        <td className="py-3 pr-4">
                          {location.ecosystem || "—"}
                        </td>
                        <td className="py-3 pr-4">
                          {location.ecosystemCode || "—"}
                        </td>
                        <td className="py-3">{location.extent ?? "—"} ha</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma localização cadastrada.
                </p>
              )}
            </div>
          )}

          {selected === "indicators" && (
            <div role="tabpanel">
              <IndicatorList
                indicators={indicators}
                activityNames={activityNames}
              />
            </div>
          )}

          {selected === "observations" && (
            <div role="tabpanel">
              {selectedActivityObservations.length ? (
                <ul className="divide-y divide-border">
                  {selectedActivityObservations.map((observation) => {
                    const indicator = indicatorById.get(
                      observation.indicatorId,
                    );
                    const color =
                      colorsByIndicator.get(observation.indicatorId) ??
                      "var(--primary)";
                    return (
                      <li
                        key={observation.id}
                        className="border-l-2 py-3 pl-3"
                        style={{ borderLeftColor: color }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <strong>
                            {indicator?.name ??
                              observation.indicator?.name ??
                              "Indicador"}
                          </strong>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {observation.value}
                          {indicator?.unit || observation.indicator?.unit
                            ? ` ${indicator?.unit ?? observation.indicator?.unit}`
                            : ""}
                          {" · "}
                          {formatDate(observation.date)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {selectedActivity
                    ? "Nenhuma observação cadastrada para esta atividade."
                    : "Selecione uma atividade para ver as observações."}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

<section className="space-y-4 rounded-lg border border-border bg-card p-6">
  <h2 className="text-lg font-semibold">Períodos de monitoramento</h2>
  <ul className="space-y-2 text-sm">
    {periods.map((period) => (
      <li key={period.id} className="flex flex-wrap items-center gap-3">
        <span>
          {period.startDate.slice(0, 10)} a {period.endDate.slice(0, 10)} · ano T {period.yearT}
          {period.verified ? " · verificado" : ""}
        </span>
        {!period.verified && role === "admin" ? (
          <form action={verifyPeriodAction}>
            <input type="hidden" name="id" value={period.id} />
            <input type="hidden" name="projectId" value={project.id} />
            <Button type="submit" size="sm">Marcar como verificado</Button>
          </form>
        ) : null}
      </li>
    ))}
  </ul>

  {role === "admin" || role === "manager" ? (
    <form action={createPeriodAction} className="grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="projectId" value={project.id} />
      <Input type="date" name="startDate" required />
      <Input type="date" name="endDate" required />
      <Input type="number" name="yearT" placeholder="Ano T" required />
      <Button type="submit">Criar período</Button>
        </form>
      ) : null}
    </section>
    </article>
    
  );
}
 