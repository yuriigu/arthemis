"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

/** Erros de validação por campo do formulário de login. */
type FieldErrors = {
  email?: string;
  password?: string;
};

/**
 * Formato de e-mail simples e suficiente para validação no cliente.
 * O contrato final é validado também pelo backend (`LoginDto` com class-validator).
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida os campos antes de liberar o envio (espelha as mensagens do schema
 * legado `UserLoginSchema`, adaptando o identificador `username` → `email`,
 * conforme o contrato atual da API).
 */
function validateLoginValues(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = "Informe seu e-mail";
  } else if (email.trim().length > 150) {
    errors.email = "E-mail muito longo";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "E-mail inválido";
  }

  if (!password) {
    errors.password = "Informe sua senha";
  } else if (password.length > 255) {
    errors.password = "Senha muito longa";
  }

  return errors;
}

/** Classes base do input, alinhadas ao componente `Input` do legado. */
const inputBaseClass =
  "h-10 w-full min-w-0 rounded-[8px] border border-transparent bg-input/50 px-3 py-[10px] text-base text-foreground outline-none transition-[color,box-shadow,background-color] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_10%,transparent)] md:text-sm";

/** Estado inválido: borda/anel em vermelho (destructive). */
const inputInvalidClass =
  "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_10%,transparent)]";

/**
 * Card de login: título/descrição, campos de E-mail e Senha, validação no
 * cliente, estado de loading no botão e banner de erro global — fiel à tela
 * de login do projeto legado (`legacy/front/.../UserLogin.svelte`).
 */
export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    // 1) Validação no cliente: campos vazios e formato de e-mail.
    const validationErrors = validateLoginValues(email, password);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // 2) A sessão é criada pelo Route Handler do Next, que grava o JWT no
    // cookie HttpOnly; o componente nunca recebe o access_token.
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.replace("/dashboard");
    } catch (error) {
      setIsSubmitting(false);
      if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
        setFormError("E-mail ou senha incorretos. Tente novamente.");
      } else {
        setFormError("Erro interno. Tente novamente.");
      }
    }
  }

  const emailInvalid = Boolean(errors.email);
  const passwordInvalid = Boolean(errors.password);

  return (
    <div className="flex flex-col gap-6 overflow-hidden rounded-[12px] border border-border bg-card py-6 text-sm text-card-foreground shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-foreground/5 dark:ring-foreground/10">
      {/* Cabeçalho do card */}
      <div className="flex flex-col gap-1.5 px-6">
        <h2 className="m-0 font-sans text-base font-medium text-foreground">
          Entrar
        </h2>
        <p className="text-sm text-muted-foreground">
          Acesse com seu usuário e senha.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 px-6">
        <div className="flex flex-col gap-4">
          {/* Campo: E-mail */}
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="flex select-none items-center gap-1 text-sm font-medium leading-none text-foreground"
            >
              E-mail
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={150}
              required
              aria-required="true"
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? "login-email-error" : undefined}
              placeholder="nome@exemplo.com"
              value={email}
              disabled={isSubmitting}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`${inputBaseClass} ${emailInvalid ? inputInvalidClass : ""}`}
            />
            {emailInvalid && (
              <p
                id="login-email-error"
                role="alert"
                className="text-sm font-medium text-destructive"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Campo: Senha */}
          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="flex select-none items-center gap-1 text-sm font-medium leading-none text-foreground"
            >
              Senha
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={255}
              required
              aria-required="true"
              aria-invalid={passwordInvalid}
              aria-describedby={passwordInvalid ? "login-password-error" : undefined}
              placeholder="Sua senha"
              value={password}
              disabled={isSubmitting}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`${inputBaseClass} ${passwordInvalid ? inputInvalidClass : ""}`}
            />
            {passwordInvalid && (
              <p
                id="login-password-error"
                role="alert"
                className="text-sm font-medium text-destructive"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Banner de erro global (ex.: credenciais incorretas) */}
          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-[14px] py-[10px] text-[13px] font-medium text-[#b91c1c]"
            >
              <span aria-hidden="true">⚠️</span>
              {formError}
            </div>
          )}
        </div>

        {/* Rodapé do formulário com botão de submissão */}
        <div className="border-t border-border px-0 pt-5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSubmitting && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

