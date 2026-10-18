"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createProject, listProponents, listSdgs } from "@/lib/projects/api";
import { createProjectSchema } from "@/lib/projects/schema";
import type { Proponent, Sdg } from "@/lib/projects/types";

type Secondary = { proponentId: string; role: string };

export function ProjectForm() {
  const router = useRouter();
  const [proponents, setProponents] = useState<Proponent[]>([]);
  const [sdgs, setSdgs] = useState<Sdg[]>([]);
  const [name, setName] = useState("");
  const [justification, setJustification] = useState("");
  const [lifetimeStart, setLifetimeStart] = useState("");
  const [lifetimeEnd, setLifetimeEnd] = useState("");
  const [proponentId, setProponentId] = useState("");
  const [secondary, setSecondary] = useState<Secondary[]>([]);
  const [sdgIds, setSdgIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void Promise.all([listProponents(), listSdgs()]).then(([people, goals]) => {
      setProponents(people);
      setSdgs(goals);
    });
  }, []);

  function toggleSdg(id: number) {
    setSdgIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function addSecondary() {
    setSecondary((current) => [...current, { proponentId: "", role: "" }]);
  }

  function updateSecondary(index: number, patch: Partial<Secondary>) {
    setSecondary((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  function removeSecondary(index: number) {
    setSecondary((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createProjectSchema.safeParse({
      name,
      justification,
      lifetimeStart,
      lifetimeEnd,
      proponentId,
      proponents: secondary,
      sdgIds,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? "form";
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await createProject(parsed.data);
      toast.success("Projeto criado");
      router.push("/projects");
    } catch {
      toast.error("Não foi possível criar o projeto");
      setSubmitting(false);
    }
  }

  const selectedSdgs = sdgs.filter((sdg) => sdgIds.includes(sdg.id));

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      <label className="flex flex-col gap-1">
        Nome
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3"
        />
        {errors.name ? <small className="text-destructive">{errors.name}</small> : null}
      </label>

      <label className="flex flex-col gap-1">
        Justificativa
        <textarea
          value={justification}
          onChange={(event) => setJustification(event.target.value)}
          className="min-h-28 rounded-lg border border-border bg-card px-3 py-2"
        />
        {errors.justification ? (
          <small className="text-destructive">{errors.justification}</small>
        ) : null}
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          Início
          <input
            type="date"
            value={lifetimeStart}
            onChange={(event) => setLifetimeStart(event.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3"
          />
          {errors.lifetimeStart ? (
            <small className="text-destructive">{errors.lifetimeStart}</small>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          Fim
          <input
            type="date"
            value={lifetimeEnd}
            onChange={(event) => setLifetimeEnd(event.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3"
          />
            {errors.lifetimeEnd ? (
                <small className="text-destructive">{errors.lifetimeEnd}</small>
            ) : null}
        </label>
      </div>

      <label className="flex flex-col gap-1">
        Proponente principal
        <select
          value={proponentId}
          onChange={(event) => setProponentId(event.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3"
        >
          <option value="">Selecione</option>
          {proponents.map((proponent) => (
            <option key={proponent.id} value={proponent.id}>
              {proponent.name}
            </option>
          ))}
        </select>
        {errors.proponentId ? (
          <small className="text-destructive">{errors.proponentId}</small>
        ) : null}
      </label>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span>Proponentes secundários</span>
          <button type="button" onClick={addSecondary} className="text-sm underline">
            Adicionar
          </button>
        </div>
        {secondary.map((item, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <select
              value={item.proponentId}
              onChange={(event) => updateSecondary(index, { proponentId: event.target.value })}
              className="h-10 rounded-lg border border-border bg-card px-3"
            >
              <option value="">Selecione</option>
              {proponents
                .filter((proponent) => proponent.id !== proponentId)
                .map((proponent) => (
                  <option key={proponent.id} value={proponent.id}>
                    {proponent.name}
                  </option>
                ))}
            </select>
            <input
              value={item.role}
              placeholder="Papel"
              onChange={(event) => updateSecondary(index, { role: event.target.value })}
              className="h-10 rounded-lg border border-border bg-card px-3"
            />
            <button type="button" onClick={() => removeSecondary(index)}>
              Remover
            </button>
          </div>
        ))}
        {errors.proponents ? (
          <small className="text-destructive">{errors.proponents}</small>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <span>ODS</span>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {sdgs.map((sdg) => {
            const selected = sdgIds.includes(sdg.id);
            return (
              <button
                key={sdg.id}
                type="button"
                onClick={() => toggleSdg(sdg.id)}
                className={`rounded-lg border p-2 ${selected ? "border-primary" : "border-border"}`}
                title={sdg.name}
              >
                <img src={sdg.iconUrl} alt={sdg.name} className="aspect-square w-full object-cover" />
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSdgs.map((sdg) => (
            <button
              key={sdg.id}
              type="button"
              onClick={() => toggleSdg(sdg.id)}
              className="rounded-full bg-sage-green-100 px-3 py-1 text-sm"
            >
              {sdg.number}. {sdg.name} ×
            </button>
          ))}
        </div>
        {errors.sdgIds ? <small className="text-destructive">{errors.sdgIds}</small> : null}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
        >
          {submitting ? "Salvando..." : "Criar projeto"}
        </button>
        <Link href="/projects" className="rounded-lg border border-border px-4 py-2">
          Cancelar
        </Link>
      </div>
    </form>
  );
}