"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/primitives";
import { FormCard } from "@/components/ui/form/FormCard";
import type { FormAction } from "@/lib/types";
import { isValidGeoJSON, validateObservation } from "@/components/ui/form/ObservationFormSchema";

export interface ObservationFormValues {
  indicator_id: string | number;
  value: string | number;
  date: string | Date;
  position: unknown;
}

export interface ObservationFormProps {
  data?: Partial<ObservationFormValues>;
  indicators: Array<{ id: number | string; name: string }>;
  recordId?: string;
  formId?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  action?: FormAction;
  className?: string;
}

function dateInputValue(value?: string | Date) {
  if (!value) return localDateValue();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ObservationForm({
  data = {},
  indicators,
  recordId,
  formId,
  title = "Observação",
  description = "Insira os dados da observação.",
  submitLabel = "Cadastrar Observação",
  action,
  className,
}: ObservationFormProps) {
  const [position, setPosition] = useState<unknown>(data.position ?? null);
  const [notice, setNotice] = useState("");

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isValidGeoJSON(parsed)) throw new Error("Invalid GeoJSON");
      setPosition(parsed);
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
        className="flex flex-col gap-5"
        id={formId}
        onSubmit={(event) => {
          const errors = validateObservation({
            indicator_id: String(new FormData(event.currentTarget).get("indicator_id") ?? ""),
            value: String(new FormData(event.currentTarget).get("value") ?? ""),
            date: String(new FormData(event.currentTarget).get("date") ?? ""),
            position,
          });
          if (errors.length) {
            event.preventDefault();
            setNotice(errors.join(" "));
          }
        }}
      >
        {recordId && <input type="hidden" name="id" value={recordId} />}
        <label className="grid gap-2 text-sm font-medium">Indicador
          <Select name="indicator_id" defaultValue={String(data.indicator_id ?? "")} required>
            <option value="" disabled>Selecione um indicador</option>
            {indicators.map((indicator) => <option key={indicator.id} value={indicator.id}>{indicator.name}</option>)}
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-medium">Valor
          <Input name="value" type="number" step="any" defaultValue={data.value ?? ""} placeholder="Valor da observação" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">Data
          <Input name="date" type="date" defaultValue={dateInputValue(data.date)} max={localDateValue()} required />
        </label>
        <label className="grid gap-2 text-sm font-medium">Posição
          <Input type="file" accept=".json,.geojson,application/geo+json,application/json" onChange={(event) => void handleUpload(event)} className="h-auto p-1 text-xs file:mr-3 file:h-8 file:rounded file:border-0 file:bg-muted file:px-3" />
          <span className="font-normal text-muted-foreground">Opcional. Envie um arquivo GeoJSON no formato JSON.</span>
        </label>
        <input type="hidden" name="position" value={position == null ? "" : JSON.stringify(position)} />
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        <Button type="submit" disabled={!action}>{submitLabel}</Button>
      </form>
    </FormCard>
  );
}
