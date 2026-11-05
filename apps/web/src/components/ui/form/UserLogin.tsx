"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormCard } from "@/components/ui/form/FormCard";
import type { FormAction } from "@/lib/types";

export interface UserLoginProps {
  data?: { username?: string; password?: string };
  title?: string;
  description?: string;
  submitLabel?: string;
  action?: FormAction;
  className?: string;
  error?: string;
}

export function UserLogin({
  data = {},
  title = "Entrar",
  description = "Acesse com seu usuário e senha.",
  submitLabel = "Entrar",
  action,
  className,
  error,
}: UserLoginProps) {
  return (
    <FormCard title={title} description={description} className={className}>
      <form action={action} className="flex flex-col gap-4">
        <label className="grid gap-2 text-sm font-semibold">Usuário
          <Input name="username" defaultValue={data.username ?? ""} placeholder="Nome do usuário" maxLength={150} autoComplete="username" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold">Senha
          <Input name="password" type="password" defaultValue={data.password ?? ""} placeholder="Sua senha" maxLength={255} autoComplete="current-password" required />
        </label>
        {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="mt-1 w-full" disabled={!action}>{submitLabel}</Button>
      </form>
    </FormCard>
  );
}
