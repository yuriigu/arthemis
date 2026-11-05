import { Suspense } from "react";
import Link from "next/link";
import { UserLogin } from "@/components/ui/form/UserLogin";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginAction } from "../actions";
import styles from "./login.module.css";

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className={styles.loginContent}>
      <header className={styles.loginHeader}>
        <div className={styles.logoSection}>
          <span className={styles.logoIcon} aria-hidden="true">🌿</span>
          <h1 className={styles.logoText}>Arthemis</h1>
        </div>
        <p className={styles.tagline}>Sistema de Monitoramento Ambiental</p>
      </header>

      <UserLogin
        action={loginAction}
        className={styles.formCard}
        error={
          error === "credentials"
            ? "Usuário ou senha incorretos."
            : error === "invalid"
            ? "Informe usuário e senha."
            : error === "session"
              ? "Sua sessão expirou ou não é mais válida. Entre novamente."
              : undefined
        }
      />

      <footer className={styles.loginFooter}>
        <p className={styles.footerText}>
          Não tem uma conta? <Link href="/register">Registre-se aqui.</Link>
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className={styles.loginContainer}>
      <div className={styles.themeToggle}><ThemeToggle /></div>
      <div className={styles.loginWrapper}>
        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-lg bg-muted" />}>
          <LoginForm searchParams={searchParams} />
        </Suspense>
        <aside className={styles.loginBackground}>
          <div className={`${styles.backgroundDecoration} ${styles.decorationOne}`} />
          <div className={`${styles.backgroundDecoration} ${styles.decorationTwo}`} />
          <div className={`${styles.backgroundDecoration} ${styles.decorationThree}`} />
          <div className={styles.backgroundText}>
            <h2>Bem-vindo ao Arthemis</h2>
            <p>Monitore e analise indicadores ambientais com precisão e facilidade.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}