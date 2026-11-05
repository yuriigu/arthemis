import { Suspense } from "react";
import {
  ApiError,
  listOrganizations,
  listObservations,
  listProjects,
  listUsers,
  type User,
  requireAuthToken,
} from "@/lib/api/server";
import { SearchResults } from "./SearchResults";

async function SearchContent() {
  const token = await requireAuthToken();
  const [organizations, projects, observations] = await Promise.all([
    listOrganizations(token),
    listProjects(token),
    listObservations(token),
  ]);
  let users: User[] = [];
  let usersUnavailable = false;

  try {
    users = await listUsers(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 403) throw error;
    usersUnavailable = true;
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Busca Geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pesquise projetos, organizações e usuários disponíveis para sua conta.</p>
      </header>
      {usersUnavailable && (
        <p role="status" className="rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground">
          A API restringiu a consulta de usuários para o perfil atual.
        </p>
      )}
      <SearchResults
        organizations={organizations}
        observations={observations}
        projects={projects.map((project) => ({
          id: project.id,
          name: project.name,
          lifetimeStart: project.lifetimeStart,
          lifetimeEnd: project.lifetimeEnd,
        }))}
        users={users.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          organization: user.proponent?.name ?? "",
        }))}
      />
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <section
          className="mx-auto max-w-6xl space-y-6"
          aria-busy="true"
          aria-label="Carregando busca"
        >
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </section>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
