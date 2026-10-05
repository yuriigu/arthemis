"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { deleteProject, listProjects } from "@/lib/projects/api";
import type { Project, PageMeta } from "@/lib/projects/types";

type ProjectsListProps = {
  search: string;
  page: number;
};

export function ProjectsList({ search, page }: ProjectsListProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(search);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    listProjects({ search, page, limit: 6 })
      .then((result) => {
        if (cancelled) return;
        setProjects(result.data);
        setMeta(result.meta);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, page]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (draft.trim()) params.set("search", draft.trim());
    params.set("page", "1");
    router.push(`/projects?${params.toString()}`);
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(nextPage));
    router.push(`/projects?${params.toString()}`);
  }

  async function onDelete(id: string) {
    if (!confirm("Excluir este projeto?")) return;
    await deleteProject(id);
    toast.success("Projeto excluído");
    router.refresh();
    const result = await listProjects({ search, page, limit: 6 });
    setProjects(result.data);
    setMeta(result.meta);
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sage-green-700">Projetos</p>
          <h1>Projetos</h1>
        </div>
        <Link
          href="/projects/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Novo projeto
        </Link>
      </header>

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Buscar por nome"
          className="h-10 flex-1 rounded-lg border border-border bg-card px-3"
        />
        <button type="submit" className="rounded-lg border border-border px-4">
          Buscar
        </button>
      </form>

      {loading ? <p>Carregando...</p> : null}

      {!loading && projects.length === 0 ? (
        <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => {
          const primary = project.proponents.find((item) => item.isPrimary);
          return (
            <article key={project.id} className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">{project.name}</h2>
              <p className="text-sm text-muted-foreground">
                {project.lifetimeStart} — {project.lifetimeEnd}
              </p>
              <p className="text-sm">{primary?.name}</p>
              <button
                type="button"
                onClick={() => onDelete(project.id)}
                className="mt-3 text-sm text-destructive"
              >
                Excluir
              </button>
            </article>
          );
        })}
      </div>

      {meta ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={meta.page <= 1}
            onClick={() => goToPage(meta.page - 1)}
            className="rounded-lg border border-border px-3 py-2 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {meta.page} de {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => goToPage(meta.page + 1)}
            className="rounded-lg border border-border px-3 py-2 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      ) : null}
    </section>
  );
}