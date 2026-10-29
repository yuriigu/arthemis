"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { createProject, listOrganizations, listSdgs } from "@/lib/projects/api";
import { createProjectSchema } from "@/lib/projects/schema";
import type { Organization, Sdg } from "@/lib/projects/types";

type Secondary = { organizationId: string; role: string };

export function ProjectForm() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sdgs, setSdgs] = useState<Sdg[]>([]);
  const [name, setName] = useState("");
  const [justification, setJustification] = useState("");
  const [lifetimeStart, setLifetimeStart] = useState("");
  const [lifetimeEnd, setLifetimeEnd] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [secondary, setSecondary] = useState<Secondary[]>([]);
  const [sdgIds, setSdgIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [optionsError, setOptionsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listOrganizations(), listSdgs()])
      .then(([people, goals]) => {
        if (cancelled) return;
        setOrganizations(people);
        setSdgs(goals);
        setOptionsError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setOptionsError(true);
        toast.error("Não foi possível carregar organizações e ODS.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleSdg(number: number) {
    setSdgIds((current) =>
      current.includes(number)
        ? current.filter((item) => item !== number)
        : [...current, number],
    );
  }

  function addSecondary() {
    setSecondary((current) => [...current, { organizationId: "", role: "" }]);
  }

  function updateSecondary(index: number, patch: Partial<Secondary>) {
    setSecondary((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function removeSecondary(index: number) {
    setSecondary((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createProjectSchema.safeParse({
      name,
      justification,
      lifetimeStart,
      lifetimeEnd,
      organizationId,
      organizations: secondary,
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
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? projectErrorMessage(error.status)
          : "Não foi possível criar o projeto.",
      );
      setSubmitting(false);
    }
  }

  const selectedSdgs = sdgs.filter((sdg) => sdgIds.includes(sdg.number));

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      <label className="flex flex-col gap-1">
        Nome
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-10 rounded-lg border border-input bg-sidebar px-3"
        />
        {errors.name ? (
          <small className="text-destructive">{errors.name}</small>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        Justificativa
        <textarea
          value={justification}
          onChange={(event) => setJustification(event.target.value)}
          className="min-h-28 rounded-lg border border-input bg-sidebar px-3 py-2"
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
            className="h-10 rounded-lg border border-input bg-sidebar px-3"
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
            className="h-10 rounded-lg border border-input bg-sidebar px-3"
          />
          {errors.lifetimeEnd ? (
            <small className="text-destructive">{errors.lifetimeEnd}</small>
          ) : null}
        </label>
      </div>

      <label className="flex flex-col gap-1">
        Organização principal
        <select
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
          className="h-10 rounded-lg border border-input bg-sidebar px-3"
        >
          <option value="">Selecione</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
        {errors.organizationId ? (
          <small className="text-destructive">{errors.organizationId}</small>
        ) : null}
      </label>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span>Organizações secundárias</span>
          <button
            type="button"
            onClick={addSecondary}
            className="text-sm underline"
          >
            Adicionar
          </button>
        </div>
        {secondary.map((item, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <select
              value={item.organizationId}
              onChange={(event) =>
                updateSecondary(index, { organizationId: event.target.value })
              }
              className="h-10 rounded-lg border border-input bg-sidebar px-3"
            >
              <option value="">Selecione</option>
              {organizations
                .filter((organization) => organization.id !== organizationId)
                .map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
            </select>
            <input
              value={item.role}
              placeholder="Papel"
              onChange={(event) =>
                updateSecondary(index, { role: event.target.value })
              }
              className="h-10 rounded-lg border border-input bg-sidebar px-3"
            />
            <button type="button" onClick={() => removeSecondary(index)}>
              Remover
            </button>
          </div>
        ))}
        {errors.organizations ? (
          <small className="text-destructive">{errors.organizations}</small>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <span>ODS</span>
        {optionsError ? (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível carregar os dados necessários. Atualize a página e
            tente novamente.
          </p>
        ) : null}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {sdgs.map((sdg) => {
            const selected = sdgIds.includes(sdg.number);
            return (
              <button
                key={sdg.id}
                type="button"
                onClick={() => toggleSdg(sdg.number)}
                className={`rounded-lg border p-2 transition-all duration-150 ${selected ? "border-primary bg-primary/10" : "border-border hover:bg-sidebar/80"}`}
                title={sdg.name}
              >
                <img
                  src={sdg.iconUrl}
                  alt={sdg.name}
                  className="aspect-square w-full object-cover"
                />
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSdgs.map((sdg) => (
            <button
              key={sdg.id}
              type="button"
              onClick={() => toggleSdg(sdg.number)}
              className="rounded-full bg-sage-green-100 px-3 py-1 text-sm font-medium border border-primary/30"
            >
              {sdg.number}. {sdg.name} ×
            </button>
          ))}
        </div>
        {errors.sdgIds ? (
          <small className="text-destructive">{errors.sdgIds}</small>
        ) : null}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-colors sm:w-auto"
        >
          {submitting ? "Salvando..." : "Criar projeto"}
        </button>
        <Link
          href="/projects"
          className="rounded-lg border border-border px-4 py-2"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function projectErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Confira os dados informados e tente novamente.";
    case 404:
      return "Um dos dados selecionados não foi encontrado.";
    case 409:
      return "Já existe um projeto com esses dados.";
    case 500:
      return "O servidor não conseguiu criar o projeto. Tente novamente.";
    default:
      return "Não foi possível criar o projeto.";
  }
}
