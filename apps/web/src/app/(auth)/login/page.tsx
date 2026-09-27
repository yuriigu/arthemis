import type { Metadata } from "next";

import { LoginForm } from "./login-form";
import { ThemeToggle } from "./theme-toggle";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Arthemis — Sistema de Monitoramento Ambiental",
};

/**
 * Tela de login (`/login`).
 * Layout isolado (rota dentro do grupo `(auth)`): sem Sidebar, Header ou
 * qualquer elemento do Shell do Dashboard.
 */
export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center bg-[linear-gradient(135deg,var(--color-sage-green-50)_0%,var(--color-sage-green-100)_100%)] p-4 sm:p-5 dark:bg-[linear-gradient(135deg,var(--color-sage-green-950)_0%,var(--color-sage-green-900)_100%)]">
      <ThemeToggle />

      <div className="grid w-full max-w-[1000px] grid-cols-1 overflow-hidden rounded-[16px] border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:grid-cols-2">
        {/* Coluna do formulário */}
        <div className="relative z-[2] flex flex-col justify-between bg-card px-5 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12">
          {/* Cabeçalho: logo + tagline */}
          <div className="mb-8 flex flex-col gap-3">
            <div className="mb-2 flex items-center gap-3">
              <span aria-hidden="true" className="text-[32px] leading-none">
                🌿
              </span>
              <h1 className="m-0 text-[20px] font-bold tracking-[-0.5px] text-foreground sm:text-2xl lg:text-[28px]">
                Arthemis
              </h1>
            </div>
            <p className="m-0 text-sm font-medium text-muted-foreground">
              Sistema de Monitoramento Ambiental
            </p>
          </div>

          <LoginForm />

          {/* Rodapé */}
          <div className="mt-6 text-center">
            <p className="m-0 text-sm text-muted-foreground">
              Não tem uma conta? Solicite acesso com o administrador do sistema.
            </p>
          </div>
        </div>

        {/* Painel decorativo (oculto no mobile, como no legado) */}
        <div className="relative hidden overflow-hidden bg-[linear-gradient(135deg,var(--primary)_0%,var(--color-sage-green-600)_100%)] px-10 py-12 text-white md:flex md:flex-col md:items-center md:justify-center dark:bg-[linear-gradient(135deg,var(--color-sage-green-700)_0%,var(--color-sage-green-850)_100%)]">
          <div
            aria-hidden="true"
            className="absolute -top-[100px] -right-[100px] h-[300px] w-[300px] rounded-full bg-white opacity-10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-[50px] -left-[50px] h-[200px] w-[200px] rounded-full bg-white opacity-10"
          />
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-10"
          />
          <div className="relative z-10 text-center">
            <h2 className="m-0 mb-3 text-[28px] font-bold tracking-[-0.5px] text-white">
              Bem-vindo ao Arthemis
            </h2>
            <p className="m-0 max-w-[300px] text-base leading-normal text-white opacity-95">
              Monitore e analise indicadores ambientais com precisão e facilidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
