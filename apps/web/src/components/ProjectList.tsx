"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FormAction } from "@/lib/types";

export interface ProjectListItem {
  id: number | string;
  name: string;
  locations?: Array<{ ecosystem: string }>;
  lifetime_start: string | Date;
  lifetime_end: string | Date;
}

function formatDate(value: string | Date) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

export function ProjectList({ projects, deleteAction }: { projects: ProjectListItem[]; deleteAction?: FormAction }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects.filter((project) =>
      !needle || String(project.id).toLowerCase().includes(needle) ||
      project.name.toLowerCase().includes(needle) ||
      project.locations?.some((location) => location.ecosystem.toLowerCase().includes(needle)),
    );
  }, [projects, query]);

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-64 flex-1" placeholder="Buscar projetos por ID, nome ou ecossistema..." />
        <span className="text-sm text-muted-foreground">{filtered.length} de {projects.length} registro(s)</span>
      </div>
      {!filtered.length ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhum projeto encontrado para a busca.</p> : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-background text-muted-foreground"><tr>{["Nome", "Ecossistema", "Período", "Ações"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
            <tbody>{filtered.map((project) => (
              <tr key={project.id} className="border-t border-border">
                <td className="px-4 py-3"><Link href={`/projects/${project.id}`} className="font-semibold text-foreground hover:underline">{project.name}</Link></td>
                <td className="px-4 py-3 text-muted-foreground">{project.locations?.map((location) => location.ecosystem).filter(Boolean).join(", ") || "Não definido"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(project.lifetime_start)} - {formatDate(project.lifetime_end)}</td>
                <td className="px-4 py-3"><form action={deleteAction}><input type="hidden" name="id" value={project.id} /><Button type="submit" variant="destructive" size="sm" disabled={!deleteAction}>Remover</Button></form></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
