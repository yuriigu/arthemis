import { Suspense } from "react";
import Link from "next/link";
import { UserList } from "@/components/UserList";
import { UserForm } from "@/components/ui/form/UserForm";
import {
  ApiError,
  listOrganizations,
  listUsers,
  requireAuthToken,
} from "@/lib/api/server";
import { createUserAction, deleteUserAction, updateUserAction } from "../actions";

async function UsersContent({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const token = await requireAuthToken();
  let users;
  try {
    users = await listUsers(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 403) throw error;

    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p role="alert" className="rounded-lg border border-border bg-secondary p-4 text-sm text-foreground">
          Sua conta não tem permissão para gerenciar usuários. Se seu acesso foi alterado recentemente, saia e entre novamente. Caso contrário, solicite acesso a um administrador.
        </p>
        <Link href="/dashboard" className="text-sm font-medium text-primary underline">
          Voltar ao painel
        </Link>
      </section>
    );
  }

  const [organizations, params] = await Promise.all([
    listOrganizations(token),
    searchParams,
  ]);
  const messages: Record<string, string> = {
    created: "Usuário cadastrado com sucesso.",
    updated: "Usuário atualizado com sucesso.",
    deleted: "Usuário removido com sucesso.",
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header><h1 className="text-2xl font-semibold">Usuários</h1><p className="mt-1 text-sm text-muted-foreground">Cadastre e gerencie perfis vinculados às organizações.</p></header>
      {params.success && messages[params.success] && <p role="status" className="rounded-md bg-secondary px-4 py-3 text-sm text-sage-green-800 dark:text-sage-green-200">{messages[params.success]}</p>}
      <UserForm proponents={organizations} action={createUserAction} />
      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Usuários cadastrados</h2>
        <UserList
          users={users.map((user) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            proponentId: user.proponentId ?? "",
            proponentName: user.proponent?.name ?? "Sem organização",
          }))}
          proponents={organizations}
          updateAction={updateUserAction}
          deleteAction={deleteUserAction}
        />
      </section>
    </section>
  );
}

export default function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <section
          className="mx-auto max-w-6xl space-y-6"
          aria-busy="true"
          aria-label="Carregando usuários"
        >
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </section>
      }
    >
      <UsersContent searchParams={searchParams} />
    </Suspense>
  );
}