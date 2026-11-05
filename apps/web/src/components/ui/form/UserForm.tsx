"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/primitives";
import { FormCard } from "@/components/ui/form/FormCard";
import type { FormAction } from "@/lib/types";

export interface UserFormValues {
  proponent_id: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "visitor";
}

export interface UserFormProps {
  data?: Partial<UserFormValues>;
  proponents: Array<{ id: number | string; name: string }>;
  title?: string;
  description?: string;
  submitLabel?: string;
  action?: FormAction;
  className?: string;
}

export function UserForm({
  data = {},
  proponents,
  title = "Novo Usuário",
  description = "Preencha os dados do usuário.",
  submitLabel = "Cadastrar Usuário",
  action,
  className,
}: UserFormProps) {
  return (
    <FormCard title={title} description={description} className={className}>
      <form action={action} className="flex flex-col gap-5">
        <label className="grid gap-2 text-sm font-medium">Organização
          <Select name="proponent_id" defaultValue={data.proponent_id ?? ""} required>
            <option value="" disabled>Selecione uma organização</option>
            {proponents.map((proponent) => <option key={proponent.id} value={proponent.id}>{proponent.name}</option>)}
          </Select>
          <span className="font-normal text-muted-foreground">Organização proponente vinculada ao usuário.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium">E-mail
          <Input name="email" type="email" defaultValue={data.email ?? ""} placeholder="usuario@organizacao.com" maxLength={150} required />
          <span className="font-normal text-muted-foreground">E-mail usado para acesso ao sistema.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium">Usuário
          <Input name="username" defaultValue={data.username ?? ""} placeholder="Nome do usuário" maxLength={150} autoComplete="username" minLength={1} required />
          <span className="font-normal text-muted-foreground">Nome usado para autenticação.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium">Senha
          <Input name="password" type="password" defaultValue={data.password ?? ""} placeholder="Senha do usuário" maxLength={255} minLength={8} autoComplete="new-password" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">Perfil
          <Select name="role" defaultValue={data.role ?? ""} required>
            <option value="" disabled>Selecione um perfil</option>
            <option value="admin">Administrador</option>
            <option value="manager">Gerente</option>
            <option value="visitor">Visitante</option>
          </Select>
          <span className="font-normal text-muted-foreground">Permissão do usuário no sistema.</span>
        </label>
        <div className="pt-1"><Button type="submit" disabled={!action}>{submitLabel}</Button></div>
      </form>
    </FormCard>
  );
}
