"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormCard } from "@/components/form-card";
import { SocialAuthButtons } from "@/features/auth/social-auth-buttons";
import type { FormAction } from "@/lib/types";

export interface UserLoginProps {
  data?: { email?: string; password?: string };
  title?: string;
  description?: string;
  submitLabel?: string;
  action?: FormAction;
  className?: string;
  error?: string;
  recoveryMessage?: string;
}

export function UserLogin({
  data = {},
  title = "Entrar",
  description = "Acesse com seu usuário e senha.",
  submitLabel = "Entrar",
  action,
  className,
  error,
  recoveryMessage,
}: UserLoginProps) {
  return (
    <FormCard title={title} description={description} className={className}>
      <form action={action} className="flex flex-col gap-4">
        <label className="grid gap-2 text-sm font-semibold text-foreground">E-mail
          <Input name="email" type="email" defaultValue={data.email ?? ""} placeholder="nome@exemplo.com" maxLength={150} autoComplete="email" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">Senha
          <Input name="password" type="password" defaultValue={data.password ?? ""} placeholder="A sua senha" maxLength={255} autoComplete="current-password" required />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 font-normal text-muted-foreground">
            <input className="size-4 accent-primary" type="checkbox" name="remember" />
            Lembrar por 30 dias
          </label>
          <Link href="/login?recovery=unavailable">Esqueceu a senha?</Link>
        </div>
        {recoveryMessage && (
          <p role="status" className="m-0 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            {recoveryMessage}
          </p>
        )}
        {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          className="mt-1 w-full"
          disabled={!action}
        >
          {submitLabel}
        </Button>
        <SocialAuthButtons />
      </form>
        </FormCard>
      );
}
