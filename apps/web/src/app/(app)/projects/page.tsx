import { Suspense } from "react";
import { ProjectList } from "@/features/projects/project-list";
import { ProjectForm } from "@/features/projects/project-form";
import { listOrganizations, listProjects, listSdgs } from "@/lib/api/server";
import { createProjectAction, deleteProjectAction } from "@/features/projects/actions";
import { requireAuthToken } from "@/lib/api/server";

async function ProjectsContent({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const token = await requireAuthToken();
  const [organizations, sdgs, projects, params] = await Promise.all([
    listOrganizations(token),
    listSdgs(token),
    listProjects(token),
    searchParams,
  ]);
  const successMessages: Record<string, string> = {
    created: "Projeto cadastrado com sucesso.",
    deleted: "Projeto removido com sucesso.",
  };

  return (
    <section className="w-full space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Projetos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cadastre e consulte os projetos vinculados às organizações.</p>
      </header>
      {params.success && successMessages[params.success] && (
        <p role="status" className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {successMessages[params.success]}
        </p>
      )}
      {params.error === "referenced" && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Não foi possível excluir este projeto porque ele está vinculado a outros registros (observações, indicadores, atividades ou localizações). Remova essas dependências antes de tentar novamente.
        </p>
      )}
      <ProjectForm
        proponents={organizations}
        sdgs={sdgs}
        action={createProjectAction}
      />
      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Projetos cadastrados</h2>
        <ProjectList
          projects={projects.map((project) => ({
            ...project,
            locations: project.locations,
            lifetime_start: project.lifetimeStart ?? "",
            lifetime_end: project.lifetimeEnd ?? "",
          }))}
          deleteAction={deleteProjectAction}
        />
      </section>
    </section>
  );
}

export default function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <section
          className="w-full space-y-6"
          aria-busy="true"
          aria-label="Carregando projetos"
        >
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="h-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </section>
      }
    >
      <ProjectsContent searchParams={searchParams} />
    </Suspense>
  );
} 
