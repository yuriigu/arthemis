"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  entityErrorMessage,
  listProjectActivities,
  listProjectIndicators,
  listProjectLocations,
  listProjectObservations,
  saveProjectIndicator,
  saveProjectObservation,
} from "@/lib/projects/entities-api";
import type {
  ProjectActivity,
  ProjectIndicator,
  ProjectLocation,
  ProjectObservation,
} from "@/lib/projects/entities";
import {
  getTodayCivilDate,
  indicatorSchema,
  observationSchema,
  type IndicatorFormData,
  type ObservationFormData,
} from "@/lib/projects/entities-schema";

type Props = { projectId: string };

export function ProjectIndicatorsTab({ projectId }: Props) {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [locations, setLocations] = useState<ProjectLocation[]>([]);
  const [indicators, setIndicators] = useState<ProjectIndicator[]>([]);
  const [observations, setObservations] = useState<ProjectObservation[]>([]);
  const [editingIndicator, setEditingIndicator] = useState<ProjectIndicator | null | undefined>();
  const [editingObservation, setEditingObservation] = useState<
    ProjectObservation | { indicatorId: string } | null | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [activityList, locationList, indicatorList, observationList] =
        await Promise.all([
          listProjectActivities(projectId),
          listProjectLocations(projectId),
          listProjectIndicators(projectId),
          listProjectObservations(projectId),
        ]);
      setActivities(activityList);
      setLocations(locationList);
      setIndicators(indicatorList);
      setObservations(observationList);
    } catch (error) {
      setLoadError(true);
      toast.error(entityErrorMessage(error, "Não foi possível carregar os indicadores e observações."));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Indicadores e observações</h2>
          <p className="text-sm text-muted-foreground">Metas de acompanhamento e valores registrados ao longo do projeto.</p>
        </div>
        <button type="button" onClick={() => setEditingIndicator(null)} disabled={activities.length === 0 || locations.length === 0} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          Novo indicador
        </button>
      </div>

      {loading ? (
        <p className="rounded-xl border border-border p-8 text-center text-muted-foreground">Carregando indicadores...</p>
      ) : loadError ? (
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Não foi possível carregar os dados de monitoramento.</p>
          <button type="button" onClick={() => void load()} className="font-medium text-sage-green-700 underline">Tentar novamente</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {indicators.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Nenhum indicador cadastrado.</p>
          ) : indicators.map((indicator) => {
            const activity = activities.find((item) => item.id === indicator.activityId);
            const location = locations.find((item) => item.id === indicator.locationId);
            const indicatorObservations = observations.filter((item) => item.indicatorId === indicator.id);
            return (
              <article key={indicator.id} className="rounded-xl border border-border bg-card p-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{indicator.name}</h3>
                    <p className="text-sm text-muted-foreground">{activity?.name ?? "Atividade"} · {location?.name ?? "Localidade"}</p>
                  </div>
                  <button type="button" onClick={() => setEditingIndicator(indicator)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Editar indicador</button>
                </header>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt className="text-muted-foreground">Unidade</dt><dd className="font-medium">{indicator.unit || "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Valor base</dt><dd className="font-medium">{indicator.valueBaseline}</dd></div>
                  <div><dt className="text-muted-foreground">Valor de referência</dt><dd className="font-medium">{indicator.valueReference}</dd></div>
                  <div><dt className="text-muted-foreground">Método</dt><dd className="font-medium">{indicator.observationMethod || "—"}</dd></div>
                </dl>
                {indicator.justification && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{indicator.justification}</p>}

                <div className="mt-5 border-t border-border pt-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-semibold">Observações</h4>
                    <button type="button" onClick={() => setEditingObservation({ indicatorId: indicator.id })} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Registrar observação</button>
                  </div>
                  {indicatorObservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma observação registrada para este indicador.</p>
                  ) : (
                    <ul className="flex flex-col divide-y divide-border">
                      {indicatorObservations.map((observation) => (
                        <li key={observation.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <div>
                            <p className="font-medium">{observation.value} {indicator.unit}</p>
                            <p className="text-sm text-muted-foreground">{new Date(`${observation.date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <button type="button" onClick={() => setEditingObservation(observation)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Editar</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editingIndicator !== undefined && (
        <IndicatorForm
          activities={activities}
          indicator={editingIndicator}
          locations={locations}
          onClose={() => setEditingIndicator(undefined)}
          onSaved={async () => {
            setEditingIndicator(undefined);
            await load();
          }}
          projectId={projectId}
        />
      )}
      {editingObservation !== undefined && (
        <ObservationForm
          indicators={indicators}
          locations={locations}
          observation={editingObservation}
          onClose={() => setEditingObservation(undefined)}
          onSaved={async () => {
            setEditingObservation(undefined);
            await load();
          }}
          projectId={projectId}
        />
      )}
    </section>
  );
}

function IndicatorForm({
  activities,
  indicator,
  locations,
  onClose,
  onSaved,
  projectId,
}: {
  activities: ProjectActivity[];
  indicator: ProjectIndicator | null;
  locations: ProjectLocation[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  projectId: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<IndicatorFormData, unknown, z.output<typeof indicatorSchema>>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: {
      activityId: indicator?.activityId ?? "",
      locationId: indicator?.locationId ?? "",
      name: indicator?.name ?? "",
      unit: indicator?.unit ?? "",
      valueBaseline: indicator?.valueBaseline ?? 0,
      valueReference: indicator?.valueReference ?? 0,
      observationMethod: indicator?.observationMethod ?? "",
      justification: indicator?.justification ?? "",
    },
  });
  const selectedActivityId = useWatch({ control, name: "activityId" });
  const linkedLocationIds = activities.find((item) => item.id === selectedActivityId)?.locationIds ?? [];
  const availableLocations = locations.filter((item) => linkedLocationIds.includes(item.id));

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  async function submit(data: z.output<typeof indicatorSchema>): Promise<void> {
    try {
      await saveProjectIndicator(projectId, indicator?.id, data);
      toast.success(indicator ? "Indicador atualizado." : "Indicador cadastrado.");
      await onSaved();
    } catch (error) {
      toast.error(entityErrorMessage(error, "Não foi possível salvar o indicador."));
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(event) => isSubmitting && event.preventDefault()}
      aria-labelledby="indicator-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-card p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <form
        onSubmit={handleSubmit(submit, () =>
          toast.error("Verifique os campos destacados antes de salvar."),
        )}
        className="p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 id="indicator-form-title" className="text-2xl font-semibold">{indicator ? "Editar indicador" : "Novo indicador"}</h3>
          <button type="button" onClick={() => dialog.current?.close()} disabled={isSubmitting} aria-label="Fechar" className="rounded-md px-2 py-1 text-xl hover:bg-accent disabled:opacity-50">×</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Nome
            <input {...register("name")} autoFocus aria-invalid={Boolean(errors.name)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.name && <span role="alert" className="text-destructive">{errors.name.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Atividade
            <select {...register("activityId")} aria-invalid={Boolean(errors.activityId)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal">
              <option value="">Selecione</option>
              {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
            </select>
            {errors.activityId && <span role="alert" className="text-destructive">{errors.activityId.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Localidade
            <select {...register("locationId")} aria-invalid={Boolean(errors.locationId)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal">
              <option value="">Selecione</option>
              {availableLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
            {errors.locationId && <span role="alert" className="text-destructive">{errors.locationId.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Unidade de medida
            <input {...register("unit")} aria-invalid={Boolean(errors.unit)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.unit && <span role="alert" className="text-destructive">{errors.unit.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Valor base
            <input {...register("valueBaseline")} type="number" step="any" aria-invalid={Boolean(errors.valueBaseline)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.valueBaseline && <span role="alert" className="text-destructive">{errors.valueBaseline.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Valor de referência
            <input {...register("valueReference")} type="number" step="any" aria-invalid={Boolean(errors.valueReference)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.valueReference && <span role="alert" className="text-destructive">{errors.valueReference.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Método de observação
            <textarea {...register("observationMethod")} rows={2} aria-invalid={Boolean(errors.observationMethod)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.observationMethod && <span role="alert" className="text-destructive">{errors.observationMethod.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Justificativa
            <textarea {...register("justification")} rows={2} aria-invalid={Boolean(errors.justification)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.justification && <span role="alert" className="text-destructive">{errors.justification.message}</span>}
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => dialog.current?.close()} disabled={isSubmitting} className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-accent disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={isSubmitting || availableLocations.length === 0} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{isSubmitting ? "Salvando..." : "Salvar indicador"}</button>
        </div>
        {availableLocations.length === 0 && <p className="mt-3 text-right text-sm text-destructive">Vincule uma localidade à atividade selecionada antes de cadastrar o indicador.</p>}
      </form>
    </dialog>
  );
}

function ObservationForm({
  indicators,
  locations,
  observation,
  onClose,
  onSaved,
  projectId,
}: {
  indicators: ProjectIndicator[];
  locations: ProjectLocation[];
  observation: ProjectObservation | { indicatorId: string } | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  projectId: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const observationId =
    observation && "id" in observation ? observation.id : undefined;
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ObservationFormData, unknown, z.output<typeof observationSchema>>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      indicatorId: observation?.indicatorId ?? "",
      value: observation && "value" in observation ? observation.value : 0,
      date: observation && "date" in observation
        ? observation.date
        : getTodayCivilDate(),
      position: observation && "position" in observation && observation.position
        ? JSON.stringify(observation.position, null, 2)
        : "",
    },
  });

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  async function submit(data: z.output<typeof observationSchema>): Promise<void> {
    try {
      await saveProjectObservation(projectId, observationId, data);
      toast.success(observationId ? "Observação atualizada." : "Observação registrada.");
      await onSaved();
    } catch (error) {
      toast.error(entityErrorMessage(error, "Não foi possível salvar a observação."));
    }
  }

  async function loadGeoJson(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const validation = observationSchema.shape.position.safeParse(text);
      if (!validation.success) {
        event.target.value = "";
        toast.error(validation.error.issues[0]?.message ?? "GeoJSON inválido.");
        return;
      }
      setValue("position", text, { shouldDirty: true, shouldValidate: true });
      toast.success("Arquivo GeoJSON carregado.");
    } catch {
      event.target.value = "";
      toast.error("Não foi possível ler o arquivo selecionado.");
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(event) => isSubmitting && event.preventDefault()}
      aria-labelledby="observation-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-xl bg-card p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <form
        onSubmit={handleSubmit(submit, () =>
          toast.error("Verifique os campos destacados antes de salvar."),
        )}
        className="p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 id="observation-form-title" className="text-2xl font-semibold">{observationId ? "Editar observação" : "Registrar observação"}</h3>
          <button type="button" onClick={() => dialog.current?.close()} disabled={isSubmitting} aria-label="Fechar" className="rounded-md px-2 py-1 text-xl hover:bg-accent disabled:opacity-50">×</button>
        </div>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Indicador
            <select {...register("indicatorId")} aria-invalid={Boolean(errors.indicatorId)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal">
              <option value="">Selecione</option>
              {indicators.map((indicator) => {
                const location = locations.find((item) => item.id === indicator.locationId);
                return <option key={indicator.id} value={indicator.id}>{indicator.name}{location ? ` — ${location.name}` : ""}</option>;
              })}
            </select>
            {errors.indicatorId && <span role="alert" className="text-destructive">{errors.indicatorId.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Valor
            <input {...register("value")} type="number" step="any" aria-invalid={Boolean(errors.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.value && <span role="alert" className="text-destructive">{errors.value.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Data
            <input {...register("date")} type="date" max={getTodayCivilDate()} aria-invalid={Boolean(errors.date)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.date && <span role="alert" className="text-destructive">{errors.date.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Arquivo JSON/GeoJSON da posição
            <input type="file" accept=".json,.geojson,application/geo+json,application/json" onChange={(event) => void loadGeoJson(event)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-secondary-foreground" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Posição / coordenadas GeoJSON
            <textarea {...register("position")} rows={5} spellCheck={false} aria-invalid={Boolean(errors.position)} placeholder={'{"type":"Point","coordinates":[-51.9,-14.2]}'} className="rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-xs font-normal" />
            {errors.position && <span role="alert" className="text-destructive">{errors.position.message}</span>}
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => dialog.current?.close()} disabled={isSubmitting} className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-accent disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={isSubmitting || indicators.length === 0} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{isSubmitting ? "Salvando..." : "Salvar observação"}</button>
        </div>
      </form>
    </dialog>
  );
}
