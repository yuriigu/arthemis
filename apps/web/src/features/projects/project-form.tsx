"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormCard, FormFieldWrapper } from "@/components/form-card";
import { validateProject } from "./project-schema";
import type { FormAction } from "@/lib/types";

export interface ProjectProponentValue { id: string; proponent_id: string; role: string }
export interface ProjectLocationValue { id: string; ecosystem: string; extent_ha: number | string; country: string; position: unknown }
export interface ProjectActivityValue { id: string; name: string; description: string; justification: string; location_ids: string[] }
export interface ProjectIndicatorValue {
  id: string; location_id: string; activity_id: string; name: string; unit: string;
  value_baseline: number | string; value_reference: number | string;
  observation_method: string; justification: string;
}
export interface ProjectFormData {
  name: string;
  proponent_id: string;
  lifetime_start: string | Date;
  lifetime_end: string | Date;
  justification: string;
  project_proponents: ProjectProponentValue[];
  project_sdgs: string[];
  locations: ProjectLocationValue[];
  activities: ProjectActivityValue[];
  indicators: ProjectIndicatorValue[];
}
export interface ProjectFormProps {
  data?: Partial<ProjectFormData>;
  proponents: Array<{ id: number | string; name: string }>;
  sdgs: Array<{ id: number | string; number: number | string; name: string; iconUrl: string }>;
  title?: string;
  description?: string;
  submitLabel?: string;
  action?: FormAction;
  className?: string;
}

const emptyData: ProjectFormData = {
  name: "", proponent_id: "", lifetime_start: "", lifetime_end: "", justification: "",
  project_proponents: [], project_sdgs: [], locations: [], activities: [], indicators: [],
};
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={`grid min-w-0 flex-1 gap-1.5 text-sm font-medium ${className}`}>{label}{children}</label>
);
const toDateValue = (value: string | Date) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export function ProjectForm({
  data = {},
  proponents,
  sdgs,
  title = "Novo Projeto",
  description = "Preencha os dados do projeto.",
  submitLabel = "Cadastrar Projeto",
  action,
  className,
}: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>({
    ...emptyData,
    ...data,
    project_proponents: data.project_proponents ?? [],
    project_sdgs: data.project_sdgs ?? [],
    locations: data.locations ?? [],
    activities: data.activities ?? [],
    indicators: data.indicators ?? [],
  });
  const [notice, setNotice] = useState("");
  const patch = <K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const updateAt = <K extends "project_proponents" | "locations" | "activities" | "indicators">(
    key: K, index: number, patchValue: Partial<ProjectFormData[K][number]>,
  ) => setForm((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) => itemIndex === index ? { ...item, ...patchValue } : item),
  }));
  const removeAt = <K extends "project_proponents" | "locations" | "activities" | "indicators">(key: K, index: number) =>
    setForm((current) => ({ ...current, [key]: current[key].filter((_, itemIndex) => itemIndex !== index) }));

  function addProponent() { patch("project_proponents", [...form.project_proponents, { id: uid(), proponent_id: "", role: "" }]); }
  function addLocation() { patch("locations", [...form.locations, { id: uid(), ecosystem: "", extent_ha: "", country: "", position: null }]); }
  function addActivity() { patch("activities", [...form.activities, { id: uid(), name: "", description: "", justification: "", location_ids: [] }]); }
  function addIndicator() {
    patch("indicators", [...form.indicators, {
      id: uid(), location_id: "", activity_id: "", name: "", unit: "", value_baseline: 0,
      value_reference: 0, observation_method: "", justification: "",
    }]);
  }

  async function uploadLocation(event: React.ChangeEvent<HTMLInputElement>, index: number) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const position: unknown = JSON.parse(await file.text());
      if (!position || typeof position !== "object" || !("type" in position) || !("coordinates" in position)) {
        throw new Error("Invalid GeoJSON");
      }
      updateAt("locations", index, { position });
      setNotice("Arquivo carregado com sucesso.");
    } catch {
      setNotice("Insira um arquivo GeoJSON válido.");
    } finally {
      input.value = "";
    }
  }

  return (
    <FormCard title={title} description={description} className={className}>
      <form
        action={action}
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          const errors = validateProject(form);
          if (errors.length) {
            event.preventDefault();
            setNotice(errors.join(" "));
          }
        }}
      >
        <Field label="Nome do Projeto"><Input name="name" value={form.name} onChange={(event) => patch("name", event.target.value)} minLength={2} maxLength={150} required /></Field>
        <Field label="Organização responsável pelo projeto">
          <Select name="proponent_id" value={form.proponent_id} onChange={(event) => patch("proponent_id", event.target.value)} required>
            <option value="" disabled>Selecione uma organização</option>{proponents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <FormFieldWrapper title="Outras Organizações" items={form.project_proponents} itemTitlePrefix="Organização" addLabel="+ Adicionar Organização" onAdd={addProponent} onRemove={(index) => removeAt("project_proponents", index)}>
          {(index) => <div className="grid w-full gap-3 md:grid-cols-2">
            <Field label="Organização"><Select value={form.project_proponents[index].proponent_id} onChange={(event) => updateAt("project_proponents", index, { proponent_id: event.target.value })}><option value="">Selecione</option>{proponents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <Field label="Função/Papel no Projeto"><Input value={form.project_proponents[index].role} onChange={(event) => updateAt("project_proponents", index, { role: event.target.value })} placeholder="Ex.: Financiador, consultor" minLength={5} required /></Field>
          </div>}
        </FormFieldWrapper>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Objetivos de Desenvolvimento Sustentável (ODS)</legend>
          <p className="text-sm text-muted-foreground">Clique sobre um ODS para vinculá-lo ao projeto.</p>
          <div className="flex flex-wrap gap-3">{sdgs.map((sdg) => {
            const id = String(sdg.id);
            const selected = form.project_sdgs.includes(id);
            return <label key={id} className={`w-24 cursor-pointer rounded border p-1 text-center text-xs ${selected ? "border-foreground ring-2 ring-ring" : "opacity-60 hover:opacity-100"}`}>
              <input className="sr-only" type="checkbox" name="project_sdgs" value={id} checked={selected} onChange={() => patch("project_sdgs", selected ? form.project_sdgs.filter((item) => item !== id) : [...form.project_sdgs, id])} />
              {sdg.iconUrl && <div role="img" aria-label={`ODS ${sdg.number} - ${sdg.name}`} style={{ backgroundImage: `url("${sdg.iconUrl}")` }} className="mb-1 aspect-square w-full bg-cover bg-center" />}
              ODS {sdg.number}: {sdg.name}
            </label>;
          })}</div>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Vigência do Projeto</legend>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Início"><Input type="date" name="lifetime_start" value={toDateValue(form.lifetime_start)} onChange={(event) => patch("lifetime_start", event.target.value)} required /></Field>
            <Field label="Término"><Input type="date" name="lifetime_end" min={toDateValue(form.lifetime_start)} value={toDateValue(form.lifetime_end)} onChange={(event) => patch("lifetime_end", event.target.value)} required /></Field>
          </div>
        </fieldset>
        <Field label="Justificativa"><Textarea name="justification" value={form.justification} onChange={(event) => patch("justification", event.target.value)} minLength={10} placeholder="Descreva a justificativa do projeto..." required /></Field>
        <FormFieldWrapper title="Localizações do Projeto" items={form.locations} itemTitlePrefix="Local" addLabel="+ Novo Local" onAdd={addLocation} onRemove={(index) => removeAt("locations", index)}>
          {(index) => {
            const location = form.locations[index];
            return <div className="grid w-full gap-3 md:grid-cols-2">
              <Field label="Ecossistema"><Input value={location.ecosystem} onChange={(event) => updateAt("locations", index, { ecosystem: event.target.value })} placeholder="Ex.: Amazônia" minLength={2} required /></Field>
              <Field label="País"><Input value={location.country} onChange={(event) => updateAt("locations", index, { country: event.target.value })} placeholder="Ex.: Brasil" minLength={2} required /></Field>
              <Field label="Extensão (hectares)"><Input type="number" step="0.01" min="0.01" value={location.extent_ha} onChange={(event) => updateAt("locations", index, { extent_ha: event.target.value })} required /></Field>
              <Field label="Posição / Coordenadas"><Input type="file" accept=".json,.geojson,application/geo+json,application/json" onChange={(event) => void uploadLocation(event, index)} className="h-auto p-1 text-xs file:mr-3 file:h-8 file:rounded file:border-0 file:bg-card file:px-3" /><input type="hidden" name={`locations[${index}][position]`} value={JSON.stringify(location.position ?? "")} /></Field>
            </div>;
          }}
        </FormFieldWrapper>
        <FormFieldWrapper title="Atividades do Projeto" items={form.activities} itemTitlePrefix="Atividade" addLabel="+ Nova Atividade" onAdd={addActivity} onRemove={(index) => removeAt("activities", index)}>
          {(index) => {
            const activity = form.activities[index];
            return <div className="grid w-full gap-3 md:grid-cols-2">
              <Field label="Nome"><Input value={activity.name} onChange={(event) => updateAt("activities", index, { name: event.target.value })} placeholder="Ex.: Remoção de resíduos sólidos" minLength={2} required /></Field>
              <Field label="Descrição"><Textarea value={activity.description} onChange={(event) => updateAt("activities", index, { description: event.target.value })} minLength={5} required /></Field>
              <Field label="Justificativa"><Textarea value={activity.justification} onChange={(event) => updateAt("activities", index, { justification: event.target.value })} minLength={5} required /></Field>
              <fieldset className="grid gap-2"><legend className="text-sm font-medium">Localizações da Atividade</legend>
                {form.locations.length === 0 ? <p className="text-sm text-muted-foreground">Adicione uma localização primeiro.</p> : form.locations.map((location) => <label key={location.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={activity.location_ids.includes(location.id)} onChange={(event) => updateAt("activities", index, { location_ids: event.target.checked ? [...activity.location_ids, location.id] : activity.location_ids.filter((id) => id !== location.id) })} />{location.ecosystem || "Novo Local"}</label>)}
              </fieldset>
            </div>;
          }}
        </FormFieldWrapper>
        <FormFieldWrapper title="Indicadores do Projeto" items={form.indicators} itemTitlePrefix="Indicador" addLabel="+ Novo Indicador" onAdd={addIndicator} onRemove={(index) => removeAt("indicators", index)}>
          {(index) => {
            const indicator = form.indicators[index];
            return <div className="grid w-full gap-3 md:grid-cols-2">
              <Field label="Nome do Indicador"><Input value={indicator.name} onChange={(event) => updateAt("indicators", index, { name: event.target.value })} placeholder="Ex.: Número de árvores plantadas" minLength={2} required /></Field>
              <Field label="Unidade"><Input value={indicator.unit} onChange={(event) => updateAt("indicators", index, { unit: event.target.value })} placeholder="Ex.: ha, unidades, %" required /></Field>
              <Field label="Localização"><Select value={indicator.location_id} onChange={(event) => updateAt("indicators", index, { location_id: event.target.value })} required><option value="">Selecione</option>{form.locations.map((location) => <option key={location.id} value={location.id}>{location.ecosystem || "Local sem nome"}</option>)}</Select></Field>
              <Field label="Atividade vinculada"><Select value={indicator.activity_id} onChange={(event) => updateAt("indicators", index, { activity_id: event.target.value })} required><option value="">Selecione</option>{form.activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name || "Atividade sem nome"}</option>)}</Select></Field>
              <Field label="Valor baseline"><Input type="number" step="any" value={indicator.value_baseline} onChange={(event) => updateAt("indicators", index, { value_baseline: event.target.value })} /></Field>
              <Field label="Valor de referência (meta)"><Input type="number" step="any" value={indicator.value_reference} onChange={(event) => updateAt("indicators", index, { value_reference: event.target.value })} /></Field>
              <Field label="Método de observação"><Textarea value={indicator.observation_method} onChange={(event) => updateAt("indicators", index, { observation_method: event.target.value })} minLength={10} required /></Field>
              <Field label="Justificativa"><Textarea value={indicator.justification} onChange={(event) => updateAt("indicators", index, { justification: event.target.value })} minLength={10} required /></Field>
            </div>;
          }}
        </FormFieldWrapper>
        <input type="hidden" name="project_data" value={JSON.stringify(form)} />
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        <Button type="submit" disabled={!action}>{submitLabel}</Button>
      </form>
    </FormCard>
  );
}
