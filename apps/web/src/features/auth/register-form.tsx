"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/form-card";
import { Input } from "@/components/ui/input";
import { SocialAuthButtons } from "@/features/auth/social-auth-buttons";
import styles from "@/features/auth/login.module.css";

export function RegisterForm() {
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("O registo de novas contas ainda não está disponível nesta plataforma.");
  }

  return (
    <FormCard
      title="Crie sua conta"
      description="Preencha seus dados para começar."
      className={styles.formCard}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Nome
          <Input
            name="name"
            type="text"
            placeholder="Seu nome"
            autoComplete="name"
            maxLength={150}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          E-mail
          <Input
            name="email"
            type="email"
            placeholder="nome@exemplo.com"
            autoComplete="email"
            maxLength={150}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Senha
          <Input
            name="password"
            type="password"
            placeholder="Crie uma senha"
            autoComplete="new-password"
            minLength={8}
            maxLength={255}
            required
          />
        </label>

        <label className="flex items-start gap-2 text-sm font-normal leading-5 text-muted-foreground">
          <input
            className="mt-0.5 size-4 shrink-0 accent-primary"
            name="terms"
            type="checkbox"
            required
          />
          Concordo com os termos e políticas
        </label>

        <Button
          type="submit"
          className="mt-1 w-full"
        >
          Registrar
        </Button>

        {notice && (
          <p role="status" className="m-0 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            {notice}
          </p>
        )}

        <SocialAuthButtons />
      </form>
    </FormCard>
  );
}
