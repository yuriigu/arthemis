"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { api, ApiError } from "@/lib/api";

type Proponent = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

const proponentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(150, "Use até 150 caracteres."),
  email: z.string().trim().min(1, "Informe o e-mail.").email("Informe um e-mail válido.").max(150, "Use até 150 caracteres."),
});

type ProponentFormData = z.infer<typeof proponentSchema>;

export function ProponentsClient() {
  const [proponents, setProponents] = useState<Proponent[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<Proponent | null | undefined>();
  const latestRequest = useRef(0);

  async function loadProponents(query = search): Promise<void> {
    const request = ++latestRequest.current;
    setIsLoading(true);
    setLoadError(false);
    try {
      const suffix = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
      const result = await api.get<Proponent[]>(`/proponents${suffix}`);
      if (request === latestRequest.current) setProponents(result);
    } catch {
      if (request === latestRequest.current) setLoadError(true);
    } finally {
      if (request === latestRequest.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadProponents(search), 300);
    return () => window.clearTimeout(timeout);
    // A busca é a única dependência: loadProponents usa apenas o valor recebido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function remove(proponent: Proponent): Promise<void> {
    if (!window.confirm(`Excluir o proponente “${proponent.name}”?`)) return;

    try {
      await api.delete(`/proponents/${proponent.id}`);
      toast.success("Proponente excluído.");
      await loadProponents();
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status === 409
          ? "Este proponente possui vínculos e não pode ser excluído."
          : "Não foi possível excluir o proponente.",
      );
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-sage-green-700">Cadastros</p>
          <h1>Proponentes</h1>
        </div>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90"
        >
          Novo proponente
        </button>
      </div>

      <label className="flex max-w-md flex-col gap-2 text-sm font-medium">
        Buscar por nome
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Digite o nome do proponente"
          className="rounded-lg border border-input bg-card px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <p className="m-0 p-8 text-center text-muted-foreground">Carregando proponentes...</p>
        ) : loadError ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Não foi possível carregar os proponentes.</p>
            <button type="button" onClick={() => void loadProponents()} className="font-medium text-sage-green-700 underline">
              Tentar novamente
            </button>
          </div>
        ) : proponents.length === 0 ? (
          <p className="m-0 p-8 text-center text-muted-foreground">
            {search.trim() ? "Nenhum proponente encontrado." : "Nenhum proponente cadastrado."}
          </p>
        ) : (
          <table className="w-full min-w-2xl text-left">
            <thead className="border-b border-border bg-muted/60 text-sm">
              <tr>
                <th className="px-5 py-3 font-semibold">Nome</th>
                <th className="px-5 py-3 font-semibold">E-mail</th>
                <th className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proponents.map((proponent) => (
                <tr key={proponent.id}>
                  <td className="px-5 py-4 font-medium">{proponent.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{proponent.email}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditing(proponent)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">
                        Editar
                      </button>
                      <button type="button" onClick={() => void remove(proponent)} className="rounded-md border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10">
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
        <ProponentForm
          proponent={editing}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined);
            await loadProponents();
          }}
        />
      )}
    </section>
  );
}

function ProponentForm({
  proponent,
  onClose,
  onSaved,
}: {
  proponent: Proponent | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProponentFormData>({
    resolver: zodResolver(proponentSchema),
    defaultValues: { name: proponent?.name ?? "", email: proponent?.email ?? "" },
  });

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  async function submit(data: ProponentFormData): Promise<void> {
    try {
      if (proponent) {
        await api.patch(`/proponents/${proponent.id}`, { body: data });
      } else {
        await api.post("/proponents", { body: data });
      }
      toast.success(proponent ? "Proponente atualizado." : "Proponente cadastrado.");
      await onSaved();
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status === 409
          ? "Já existe um proponente com este e-mail."
          : "Não foi possível salvar o proponente.",
      );
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(event) => isSubmitting && event.preventDefault()}
      aria-labelledby="proponent-form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl bg-card p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <form onSubmit={handleSubmit(submit)} className="p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id="proponent-form-title" className="text-2xl">
            {proponent ? "Editar proponente" : "Novo proponente"}
          </h2>
          <button type="button" onClick={() => dialog.current?.close()} disabled={isSubmitting} aria-label="Fechar" className="rounded-md px-2 py-1 text-xl hover:bg-accent disabled:opacity-50">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Nome
            <input {...register("name")} autoFocus className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-ring" />
            {errors.name && <span className="text-sm text-destructive">{errors.name.message}</span>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            E-mail
            <input {...register("email")} type="email" className="rounded-lg border border-input bg-background px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-ring" />
            {errors.email && <span className="text-sm text-destructive">{errors.email.message}</span>}
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => dialog.current?.close()} disabled={isSubmitting} className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-accent disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
