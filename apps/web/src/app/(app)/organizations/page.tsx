import { Suspense } from "react";
import { OrganizationList } from "@/components/OrganizationList";
import { ProponentForm } from "@/components/ui/form/ProponentForm";
import {
  createOrganizationAction,
  deleteOrganizationAction,
  updateOrganizationAction,
} from "../actions";
import { listOrganizations, requireAuthToken } from "@/lib/api/server";

async function OrganizationsContent({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const token = await requireAuthToken();
  const [organizations, params] = await Promise.all([
    listOrganizations(token),
    searchParams,
  ]);
  const messages: Record<string, string> = {
    created: "Organização cadastrada com sucesso.",
    updated: "Organização atualizada com sucesso.",
    deleted: "Organização removida com sucesso.",
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header><h1 className="text-2xl font-semibold">Organizações</h1><p className="mt-1 text-sm text-muted-foreground">Cadastre, edite e remova as organizações do sistema.</p></header>
      {params.success && messages[params.success] && <p role="status" className="rounded-md bg-secondary px-4 py-3 text-sm text-sage-green-800 dark:text-sage-green-200">{messages[params.success]}</p>}
      {params.error === "referenced" && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Não foi possível excluir esta organização porque ela está vinculada a projetos. Transfira ou remova os projetos antes de tentar novamente.
        </p>
      )}
      <ProponentForm action={createOrganizationAction} />
      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Organizações cadastradas</h2>
        <OrganizationList
          organizations={organizations}
          updateAction={updateOrganizationAction}
          deleteAction={deleteOrganizationAction}
        />
      </section>
    </section>
  );
}

export default function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <section
          className="mx-auto max-w-6xl space-y-6"
          aria-busy="true"
          aria-label="Carregando organizações"
        >
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </section>
      }
    >
      <OrganizationsContent searchParams={searchParams} />
    </Suspense>
  );
}