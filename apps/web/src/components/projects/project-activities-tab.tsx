"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  entityErrorMessage,
  listProjectActivities,
  listProjectLocations,
  saveProjectActivity,
} from "@/lib/projects/entities-api";
import type { ProjectActivity, ProjectLocation } from "@/lib/projects/entities";
import {
  activitySchema,
  type ActivityFormData,
} from "@/lib/projects/entities-schema";

type Props = { projectId: string };

export function ProjectActivitiesTab({ projectId }: Props) {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [locations, setLocations] = useState<ProjectLocation[]>([]);
  const [editing, setEditing] = useState<ProjectActivity | null | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [activityList, locationList] = await Promise.all([
        listProjectActivities(projectId),
        listProjectLocations(projectId),
      ]);
      setActivities(activityList);
      setLocations(locationList);
    } catch (error) {
      setLoadError(true);
      toast.error(entityErrorMessage(error, "Não foi possível carregar as atividades."));
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
          <h2 className="text-xl font-semibold">Atividades</h2>
          <p className="text-sm text-muted-foreground">Atividades e período de execução do projeto.</p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90">
          Nova atividade
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="rounded-xl border border-border p-8 text-center text-muted-foreground">Carregando atividades...</p>
        ) : loadError ? (
          <div className="rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">Não foi possível carregar as atividades.</p>
            <button type="button" onClick={() => void load()} className="font-medium text-sage-green-700 underline">Tentar novamente</button>
          </div>
        ) : activities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Nenhuma atividade cadastrada.</p>
        ) : (
          activities.map((activity) => (
            <article key={activity.id} className="rounded-xl border border-border bg-card p-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{activity.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activity.startDate ? new Date(`${activity.startDate}T00:00:00`).toLocaleDateString("pt-BR") : "Sem início"}
                    {" — "}
                    {activity.endDate ? new Date(`${activity.endDate}T00:00:00`).toLocaleDateString("pt-BR") : "Sem término"}
                  </p>
                </div>
                <button type="button" onClick={() => setEditing(activity)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Editar</button>
              </header>
              <p className="mt-3 whitespace-pre-wrap text-sm">{activity.description}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Localidades: {activity.locationIds.map((id) => locations.find((location) => location.id === id)?.name ?? "Localidade removida").join(", ") || "Nenhuma"}
              </p>
            </article>
          ))
        )}
      </div>

      {editing !== undefined && (
        <ActivityForm
          activity={editing}
          locations={locations}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined);
            await load();
          }}
          projectId={projectId}
        />
      )}
    </section>
  );
}

function ActivityForm({
  activity,
  locations,
  onClose,
  onSaved,
  projectId,
}: {
  activity: ProjectActivity | null;
  locations: ProjectLocation[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  projectId: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: activity?.name ?? "",
      description: activity?.description ?? "",
      justification: activity?.justification ?? "",
      startDate: activity?.startDate ?? "",
      endDate: activity?.endDate ?? "",
      locationIds: activity?.locationIds ?? [],
    },
  });

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  async function submit(data: ActivityFormData): Promise<void> {
    try {
      await saveProjectActivity(projectId, activity?.id, data);
      toast.success(activity ? "Atividade atualizada." : "Atividade cadastrada.");
      await onSaved();
    } catch (error) {
      toast.error(entityErrorMessage(error, "Não foi possível salvar a atividade."));
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(event) => isSubmitting && event.preventDefault()}
      aria-labelledby="activity-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-card p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <form
        onSubmit={handleSubmit(submit, () =>
          toast.error("Verifique os campos destacados antes de salvar."),
        )}
        className="p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 id="activity-form-title" className="text-2xl font-semibold">{activity ? "Editar atividade" : "Nova atividade"}</h3>
          <button type="button" onClick={() => dialog.current?.close()} disabled={isSubmitting} aria-label="Fechar" className="rounded-md px-2 py-1 text-xl hover:bg-accent disabled:opacity-50">×</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Nome
            <input {...register("name")} autoFocus aria-invalid={Boolean(errors.name)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.name && <span role="alert" className="text-destructive">{errors.name.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Descrição
            <textarea {...register("description")} rows={3} aria-invalid={Boolean(errors.description)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.description && <span role="alert" className="text-destructive">{errors.description.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Justificativa
            <textarea {...register("justification")} rows={2} aria-invalid={Boolean(errors.justification)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.justification && <span role="alert" className="text-destructive">{errors.justification.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Data de início
            <input {...register("startDate")} type="date" aria-invalid={Boolean(errors.startDate)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.startDate && <span role="alert" className="text-destructive">{errors.startDate.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Data de término
            <input {...register("endDate")} type="date" aria-invalid={Boolean(errors.endDate)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.endDate && <span role="alert" className="text-destructive">{errors.endDate.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Localidades vinculadas
            <select {...register("locationIds")} multiple aria-invalid={Boolean(errors.locationIds)} className="min-h-28 rounded-lg border border-input bg-background px-3 py-2.5 font-normal">
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name} — {location.country}</option>)}
            </select>
            <span className="font-normal text-muted-foreground">Use Ctrl/Cmd para selecionar mais de uma localidade.</span>
            {errors.locationIds && <span role="alert" className="text-destructive">{errors.locationIds.message}</span>}
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => dialog.current?.close()} disabled={isSubmitting} className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-accent disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={isSubmitting || locations.length === 0} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {isSubmitting ? "Salvando..." : "Salvar atividade"}
          </button>
        </div>
        {locations.length === 0 && <p className="mt-3 text-right text-sm text-destructive">Cadastre ao menos uma localidade antes de criar a atividade.</p>}
      </form>
    </dialog>
  );
}
