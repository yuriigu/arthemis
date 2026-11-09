"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import RecordActions from "@/components/record-actions";
import type { FormAction } from "@/lib/types";

export interface UserListRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  proponentId: string | number;
  proponentName: string;
}

export interface UserListOrganization {
  id: string | number;
  name: string;
}

const roles = [
  { value: "admin", label: "Administrador" },
  { value: "manager", label: "Gerente" },
  { value: "visitor", label: "Visitante" },
] as const;

export function UserList({ users, proponents, updateAction, deleteAction }: { users: UserListRecord[]; proponents: UserListOrganization[]; updateAction?: FormAction; deleteAction?: FormAction }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) =>
      !needle || [user.id, user.username, user.email, user.role, user.proponentName].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [users, query]);
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-64 flex-1" placeholder="Buscar usuários por ID, nome, e-mail, perfil ou organização..." />
        <span className="text-sm text-muted-foreground">{filtered.length} de {users.length} registro(s)</span>
      </div>
      {!filtered.length ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhum usuário cadastrado ou encontrado para a busca.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead><tr className="text-xs font-semibold text-muted-foreground"><th className="px-2 py-3">Usuário</th><th className="px-2 py-3">Dados</th><th className="px-2 py-3">Ações</th></tr></thead>
            <tbody>{filtered.map((user) => {
              const formId = `user-${user.id}`;
              return <tr key={user.id} className="border-t border-border align-top">
                <td className="px-2 py-3"><strong className="block">{user.username}</strong><span className="text-muted-foreground">{user.id}</span></td>
                <td className="px-2 py-3"><form action={updateAction} id={formId} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <input type="hidden" name="id" value={user.id} />
                  <label className="grid gap-1.5 text-xs text-muted-foreground">Organização
                    <Select name="proponent_id" required defaultValue={user.proponentId}><option value="" disabled>Selecione</option>{proponents.map((proponent) => <option key={proponent.id} value={proponent.id}>{proponent.name}</option>)}</Select>
                  </label>
                  <label className="grid gap-1.5 text-xs text-muted-foreground">Usuário<Input name="username" defaultValue={user.username} required maxLength={150} /></label>
                  <label className="grid gap-1.5 text-xs text-muted-foreground">E-mail<Input name="email" type="email" defaultValue={user.email} required maxLength={150} /></label>
                  <label className="grid gap-1.5 text-xs text-muted-foreground">Perfil
                    <Select name="role" required defaultValue={user.role}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</Select>
                  </label>
                </form></td>
                <td className="px-2 py-3"><RecordActions updateFormId={formId} deleteId={user.id} updateAction={updateAction} deleteAction={deleteAction} /></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
