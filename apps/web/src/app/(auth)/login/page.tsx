import { Suspense } from "react";
import Link from "next/link";
import { UserLogin } from "@/features/auth/login-form";
import { loginAction } from "@/features/auth/actions";
import styles from "@/features/auth/login.module.css";

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; recovery?: string }>;
}) {
  const { error, recovery } = await searchParams;

  return (
    <>
      <UserLogin
        action={loginAction}
        className={styles.formCard}
        title="Entrar"
        description="Aceda à sua conta com o seu e-mail e senha."
        error={
          error === "credentials"
            ? "E-mail ou senha incorretos."
            : error === "invalid"
            ? "Informe um e-mail e uma senha válidos."
            : error === "session"
              ? "A sua sessão expirou ou já não é válida. Entre novamente."
              : undefined
        }
        recoveryMessage={recovery === "unavailable" ? "A recuperação de senha ainda não está disponível." : undefined}
      />

      <footer className={styles.loginFooter}>
        <p className={styles.footerText}>
          Não tem uma conta? <Link href="/register">Registre-se aqui.</Link>
        </p>
      </footer>
    </>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; recovery?: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-lg bg-sage-green-800" />}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}