"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormCard } from "@/components/ui/form/FormCard";
import type { FormAction } from "@/lib/types";

export interface ProponentFormValues {
  name: string;
  email: string;
}

export interface ProponentFormProps {
  data?: Partial<ProponentFormValues>;
  title?: string;
  description?: string;
  submitLabel?: string;
  action?: FormAction;
  className?: string;
}

export function ProponentForm({
  data = {},
  title = "Nova Organização",
  description = "Preencha os dados da organização.",
  submitLabel = "Cadastrar Organização",
  action,
  className,
}: ProponentFormProps) {
  return (
    <FormCard title={title} description={description} className={className}>
      <form action={action} className="flex flex-col gap-5">
        <label className="grid gap-2 text-sm font-medium">Nome
          <Input name="name" defaultValue={data.name ?? ""} placeholder="Nome da organização" maxLength={150} minLength={2} required />
          <span className="font-normal text-muted-foreground">Nome completo da organização.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium">E-mail
          <Input name="email" type="email" defaultValue={data.email ?? ""} placeholder="contato@organizacao.com" maxLength={150} required />
          <span className="font-normal text-muted-foreground">E-mail de contato da organização.</span>
        </label>
        <div className="pt-1"><Button type="submit" disabled={!action}>{submitLabel}</Button></div>
      </form>
    </FormCard>
  );
}
