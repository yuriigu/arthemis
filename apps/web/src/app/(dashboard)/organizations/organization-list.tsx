"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { api, ApiError } from "@/lib/api";

type Organization = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(150, "Use até 150 caracteres."),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail válido.")
    .max(150, "Use até 150 caracteres."),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export function OrganizationList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<Organization | null | undefined>();
  const latestRequest = useRef(0);

  async function loadOrganizations(query = search): Promise<void> {
    const request = ++latestRequest.current;
    setIsLoading(true);
    setLoadError(false);
    try {
      const suffix = query.trim()
        ? `?search=${encodeURIComponent(query.trim())}`
        : "";
      const result = await api.get<Organization[]>(`/organizations${suffix}`);
      if (request === latestRequest.current) setOrganizations(result);
    } catch {
      if (request === latestRequest.current) setLoadError(true);
    } finally {
      if (request === latestRequest.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(
      () => void loadOrganizations(search),
      300,
    );
    return () => window.clearTimeout(timeout);
    // A busca é a única dependência: loadOrganizations usa apenas o valor recebido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function remove(organization: Organization): Promise<void> {
    if (!window.confirm(`Excluir a organização “${organization.name}”?`))
      return;

    try {
      await api.delete(`/organizations/${organization.id}`);
      toast.success("Organização excluída.");
      await loadOrganizations();
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status === 409
          ? "Esta organização possui vínculos e não pode ser excluída."
          : "Não foi possível excluir a organização.",
      );
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-foreground/70">Cadastros</p>
          <h1>Organizações</h1>
        </div>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90"
        >
          Nova organização
        </button>
      </div>

      <label className="flex max-w-md flex-col gap-2 text-sm font-medium">
        Buscar por nome
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Digite o nome da organização"
          className="rounded-lg border border-input bg-sidebar px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-ring pl-8"
        />
      </label>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <p className="m-0 p-8 text-center text-muted-foreground">
            Carregando organizações...
          </p>
        ) : loadError ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Não foi possível carregar as organizações.
            </p>
            <button
              type="button"
              onClick={() => void loadOrganizations()}
              className="font-medium text-sage-green-700 underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : organizations.length === 0 ? (
          <p className="m-0 p-8 text-center text-muted-foreground">
            {search.trim()
              ? "Nenhuma organização encontrada."
              : "Nenhuma organização cadastrada."}
          </p>
        ) : (
          <table className="w-full min-w-2xl text-left">
            <thead className="border-b border-border bg-sidebar/80 text-sm">
              <tr>
                <th className="px-5 py-3 font-semibold">Nome</th>
                <th className="px-5 py-3 font-semibold">E-mail</th>
                <th className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {organizations.map((organization) => (
                <tr key={organization.id}>
                  <td className="px-5 py-4 font-medium text-foreground">{organization.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {organization.email}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(organization)}
                        className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(organization)}
                        className="rounded-md border border-destructive bg-transparent px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing !== undefined && (
        <OrganizationForm
          organization={editing}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined);
            await loadOrganizations();
          }}
        />
      )}
    </section>
  );
}

function OrganizationForm({
  organization,
  onClose,
  onSaved,
}: {
  organization: Organization | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name ?? "",
      email: organization?.email ?? "",
    },
  });

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  async function submit(data: OrganizationFormData): Promise<void> {
    try {
      if (organization) {
        await api.patch(`/organizations/${organization.id}`, { body: data });
      } else {
        await api.post("/organizations", { body: data });
      }
      toast.success(
        organization ? "Organização atualizada." : "Organização cadastrada.",
      );
      await onSaved();
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status === 409
          ? "Já existe uma organização com este e-mail."
          : "Não foi possível salvar a organização.",
      );
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(event) => isSubmitting && event.preventDefault()}
      aria-labelledby="organization-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl bg-card p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <form onSubmit={handleSubmit(submit)} className="p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id="organization-form-title" className="text-2xl">
            {organization ? "Editar organização" : "Nova organização"}
          </h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            disabled={isSubmitting}
            aria-label="Fechar"
            className="rounded-md px-2 py-1 text-xl hover:bg-accent disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Nome
            <input
              {...register("name")}
              autoFocus
              className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.name && (
              <span className="text-sm text-destructive">
                {errors.name.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            E-mail
            <input
              {...register("email")}
              type="email"
              className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.email && (
              <span className="text-sm text-destructive">
                {errors.email.message}
              </span>
            )}
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            disabled={isSubmitting}
            className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-accent disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
