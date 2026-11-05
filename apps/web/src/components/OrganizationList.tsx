"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import RecordActions from "@/components/RecordActions";
import type { FormAction } from "@/lib/types";

export interface OrganizationRecord {
  id: number | string;
  name: string;
  email: string;
}

export function OrganizationList({ organizations, updateAction, deleteAction }: { organizations: OrganizationRecord[]; updateAction?: FormAction; deleteAction?: FormAction }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return organizations.filter((organization) =>
      !needle || [organization.id, organization.name, organization.email].some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [organizations, query]);
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-64 flex-1" placeholder="Buscar organizações por ID, nome ou e-mail..." />
        <span className="text-sm text-muted-foreground">{filtered.length} de {organizations.length} registro(s)</span>
      </div>
      {!filtered.length ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma organização cadastrada ou encontrada para a busca.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead><tr className="text-xs font-semibold text-muted-foreground"><th className="px-2 py-3">ID</th><th className="px-2 py-3">Nome</th><th className="px-2 py-3">E-mail</th><th className="px-2 py-3">Ações</th></tr></thead>
            <tbody>{filtered.map((organization) => {
              const formId = `organization-${organization.id}`;
              return <tr key={organization.id} className="border-t border-border">
                <td className="px-2 py-3">{organization.id}</td>
                <td colSpan={2} className="px-2 py-3"><form action={updateAction} id={formId} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={organization.id} />
                  <Input name="name" defaultValue={organization.name} required maxLength={150} aria-label="Nome da organização" />
                  <Input name="email" type="email" defaultValue={organization.email} required maxLength={150} aria-label="E-mail da organização" />
                </form></td>
                <td className="px-2 py-3"><RecordActions updateFormId={formId} deleteId={organization.id} updateAction={updateAction} deleteAction={deleteAction} /></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
