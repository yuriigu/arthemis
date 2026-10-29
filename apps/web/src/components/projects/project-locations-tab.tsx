"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  entityErrorMessage,
  listProjectLocations,
  saveProjectLocation,
} from "@/lib/projects/entities-api";
import type { ProjectLocation } from "@/lib/projects/entities";
import {
  locationSchema,
  type LocationFormData,
} from "@/lib/projects/entities-schema";

type Props = { projectId: string };

export function ProjectLocationsTab({ projectId }: Props) {
  const [locations, setLocations] = useState<ProjectLocation[]>([]);
  const [editing, setEditing] = useState<ProjectLocation | null | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setLocations(await listProjectLocations(projectId));
    } catch (error) {
      setLoadError(true);
      toast.error(entityErrorMessage(error, "Não foi possível carregar as localidades."));
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
          <h2 className="text-xl font-semibold">Localidades</h2>
          <p className="text-sm text-muted-foreground">Áreas do projeto e sua geometria em GeoJSON.</p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90">
          Nova localidade
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {loading ? (
          <p className="rounded-xl border border-border p-8 text-center text-muted-foreground md:col-span-2">Carregando localidades...</p>
        ) : loadError ? (
          <div className="rounded-xl border border-border p-8 text-center md:col-span-2">
            <p className="text-muted-foreground">Não foi possível carregar as localidades.</p>
            <button type="button" onClick={() => void load()} className="font-medium text-sage-green-700 underline">Tentar novamente</button>
          </div>
        ) : locations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground md:col-span-2">Nenhuma localidade cadastrada.</p>
        ) : (
          locations.map((location) => (
            <article key={location.id} className="rounded-xl border border-border bg-card p-5">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{location.name}</h3>
                  <p className="text-sm text-muted-foreground">{location.country} — {location.ecosystem}</p>
                </div>
                <button type="button" onClick={() => setEditing(location)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Editar</button>
              </header>
              {location.description && <p className="mt-3 whitespace-pre-wrap text-sm">{location.description}</p>}
              <p className="mt-3 text-sm text-muted-foreground">Área: {location.extent} ha</p>
              <p className="mt-1 text-xs text-muted-foreground">{location.position ? "Geometria GeoJSON cadastrada" : "Sem geometria"}</p>
              {Boolean(location.position) && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-sage-green-700">Ver coordenadas GeoJSON</summary>
                  <pre className="mt-2 overflow-auto rounded-md bg-muted p-3">{JSON.stringify(location.position, null, 2)}</pre>
                </details>
              )}
            </article>
          ))
        )}
      </div>

      {editing !== undefined && (
        <LocationForm
          location={editing}
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

function LocationForm({
  location,
  onClose,
  onSaved,
  projectId,
}: {
  location: ProjectLocation | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  projectId: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormData, unknown, z.output<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name ?? "",
      description: location?.description ?? "",
      ecosystem: location?.ecosystem ?? "",
      country: location?.country ?? "",
      extent: location?.extent ?? 0,
      position: location?.position
        ? JSON.stringify(location.position, null, 2)
        : "",
    },
  });

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  async function submit(data: z.output<typeof locationSchema>): Promise<void> {
    try {
      await saveProjectLocation(projectId, location?.id, data);
      toast.success(location ? "Localidade atualizada." : "Localidade cadastrada.");
      await onSaved();
    } catch (error) {
      toast.error(entityErrorMessage(error, "Não foi possível salvar a localidade."));
    }
  }

  async function loadGeoJson(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const validation = locationSchema.shape.position.safeParse(text);
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
      aria-labelledby="location-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-card p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <form
        onSubmit={handleSubmit(submit, () =>
          toast.error("Verifique os campos destacados antes de salvar."),
        )}
        className="p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 id="location-form-title" className="text-2xl font-semibold">{location ? "Editar localidade" : "Nova localidade"}</h3>
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
            <textarea {...register("description")} rows={2} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.description && <span role="alert" className="text-destructive">{errors.description.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            País
            <input {...register("country")} aria-invalid={Boolean(errors.country)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.country && <span role="alert" className="text-destructive">{errors.country.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Ecossistema
            <input {...register("ecosystem")} aria-invalid={Boolean(errors.ecosystem)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.ecosystem && <span role="alert" className="text-destructive">{errors.ecosystem.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Área (ha)
            <input {...register("extent")} type="number" step="any" min="0.01" aria-invalid={Boolean(errors.extent)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal" />
            {errors.extent && <span role="alert" className="text-destructive">{errors.extent.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Arquivo JSON/GeoJSON
            <input type="file" accept=".json,.geojson,application/geo+json,application/json" onChange={(event) => void loadGeoJson(event)} className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-secondary-foreground" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
            Geometria / coordenadas GeoJSON
            <textarea {...register("position")} rows={6} spellCheck={false} aria-invalid={Boolean(errors.position)} placeholder={'{"type":"Point","coordinates":[-51.9,-14.2]}'} className="rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-xs font-normal" />
            {errors.position && <span role="alert" className="text-destructive">{errors.position.message}</span>}
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => dialog.current?.close()} disabled={isSubmitting} className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-accent disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {isSubmitting ? "Salvando..." : "Salvar localidade"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
